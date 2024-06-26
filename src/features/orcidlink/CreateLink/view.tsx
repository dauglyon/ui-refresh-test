/**
 * The CreateLink component user interface.
 *
 * The primary purpose of this component is to display a user interface to
 * allow a user to create a link.
 */
import { faArrowRight, faMailReply } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../layout/layoutSlice';
import Loading from '../common/Loading';
import {
  ORCID_LABEL,
  ORCID_LINK_LABEL,
  ORCID_SIGN_IN_SCREENSHOT_URL,
} from '../constants';
import { CreateLinkState, CreateLinkStatus } from './controller';

export interface ORCIDLinkCreateLinkProps {
  createLinkState: CreateLinkState;
  createLinkSession: () => void;
}

export default function ORCIDLinkCreateLink({
  createLinkState,
  createLinkSession,
}: ORCIDLinkCreateLinkProps) {
  usePageTitle('ORCID Link - Create Link');
  const navigate = useNavigate();

  function renderStatus() {
    switch (createLinkState.status) {
      case CreateLinkStatus.NONE:
        return;
      case CreateLinkStatus.DETERMINING_ELIGIBILITY:
        return (
          <Box sx={{ mt: 1 }}>
            <Loading title="Determining Eligibility …" />
          </Box>
        );
      case CreateLinkStatus.CREATING_SESSION:
        return (
          <Box sx={{ mt: 1 }}>
            <Loading title="Creating Linking Session …" />
          </Box>
        );
      case CreateLinkStatus.SESSION_CREATED:
        return (
          <Box sx={{ mt: 1 }}>
            <Alert color="success">
              Linking Session Created, Redirecting...
            </Alert>
          </Box>
        );
      case CreateLinkStatus.ERROR:
        return (
          <Box sx={{ mt: 1 }}>
            <Alert color="error">{createLinkState.error.message}</Alert>
          </Box>
        );
      case CreateLinkStatus.CANCELED:
      case CreateLinkStatus.CAN_CREATE_SESSION:
        return null;
    }
  }

  return (
    <Grid container rowSpacing={2} columnSpacing={2}>
      <Grid xs={6}>
        <Card variant="outlined">
          <CardHeader title="Create Your KBase ORCID® Link" />
          <CardContent>
            <p>
              You do not currently have a link from your KBase account to an{' '}
              {ORCID_LABEL} account.
            </p>

            <p>
              <b>
                After clicking the &quot;Continue&quot; button below, you will
                be redirected to {ORCID_LABEL}
              </b>
              , where you may sign in to your {ORCID_LABEL} account and grant
              permission to KBase to access certain aspects of your{' '}
              {ORCID_LABEL} account.
            </p>

            <p>
              <i>What if you don&apos;t have an {ORCID_LABEL} Account?</i> Check
              out the FAQs to the right for an answer.
            </p>

            <p>
              After finishing at {ORCID_LABEL}, you will be returned to KBase
              and asked to confirm the link. Once confirmed, the{' '}
              {ORCID_LINK_LABEL}
              will be added to your account.
            </p>

            <p>
              For security purposes, once you continue to ORCID (start a linking
              session), you will have <b>10 minutes to complete</b> the process.
            </p>

            <p>
              For more information,{' '}
              <a
                href="https://www.kbase.us/orcidlink"
                target="_blank'"
                rel="noreferrer"
              >
                consult the {ORCID_LINK_LABEL} documentation
              </a>
              .
            </p>
          </CardContent>
          {/* Note that the card actions padding is overridden so that it matches 
                that of the card content and header. There are a number of formatting 
                issues with Cards. Some will apparently be fixed in v6. */}
          <CardActions style={{ justifyContent: 'center' }} sx={{ p: 2 }}>
            <div style={{ flex: '1 1 0', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="outlined"
                  type="button"
                  color="error"
                  sx={{ mr: 1 }}
                  disabled={
                    createLinkState.status !==
                    CreateLinkStatus.CAN_CREATE_SESSION
                  }
                  onClick={() => {
                    navigate('/orcidlink');
                  }}
                  startIcon={<FontAwesomeIcon icon={faMailReply} size="lg" />}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  disabled={
                    createLinkState.status !==
                    CreateLinkStatus.CAN_CREATE_SESSION
                  }
                  onClick={() => {
                    createLinkSession();
                  }}
                  endIcon={<FontAwesomeIcon icon={faArrowRight} size="lg" />}
                >
                  Continue to {ORCID_LABEL}
                </Button>
              </div>
              {renderStatus()}
            </div>
          </CardActions>
        </Card>
      </Grid>
      <Grid xs={6}>
        <Card variant="outlined">
          <CardHeader title="FAQs" />
          <CardContent>
            <Accordion>
              <AccordionSummary>
                What if I don't have an {ORCID_LABEL} Account?
              </AccordionSummary>
              <AccordionDetails>
                <p>
                  In order to link your {ORCID_LABEL} account to your KBase
                  account, you will need to sign in at {ORCID_LABEL}.
                </p>
                <p>But what if you don&apos;t have an {ORCID_LABEL} account?</p>
                <p>
                  When you reach the {ORCID_LABEL} Sign In page, you may elect
                  to register for a new account.
                </p>
                <img
                  src={ORCID_SIGN_IN_SCREENSHOT_URL}
                  alt="ORCID® Sign In"
                  style={{
                    width: '80%',
                    boxShadow: '4px 4px 4px 4px rgba(100, 100, 100, 1)',
                    marginBottom: '20px',
                  }}
                />
                <p>
                  After registering, the linking process will be resumed, just
                  as if you had simply signed in with an existing {ORCID_LABEL}{' '}
                  account.
                </p>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary>
                But I already log in with {ORCID_LABEL}
              </AccordionSummary>
              <AccordionDetails>
                <p>
                  If you already log in with {ORCID_LABEL}, it may seem odd to
                  need to create a separate {ORCID_LINK_LABEL}.
                </p>
                <p>
                  Your {ORCID_LABEL} sign-in link is only used to obtain your{' '}
                  {ORCID_LABEL} iD during sign-in. This is, in turn, used to
                  look up the associated KBase account and log you in.
                </p>
                <p>
                  In contrast, {ORCID_LINK_LABEL} provides expanded and
                  long-term access, which allows KBase to provide tools for you
                  that that can access limited aspects of your {ORCID_LABEL}{' '}
                  account. The {ORCID_LINK_LABEL} can be added or removed at any
                  time without affecting your ability to sign in to KBase
                  through {ORCID_LABEL}.
                </p>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
