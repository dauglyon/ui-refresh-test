import {
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Button,
  Stack,
} from '@mui/material';
import { FC } from 'react';
import type { SetModalView } from './CollectionDetail';
import {
  getCollection,
  getGenomeAttribs,
  getSampleAttribs,
} from '../../common/api/collectionsApi';
import { Loader } from '../../common/components/Loader';
import { SampleAttribs } from './data_products/SampleAttribs';
import { TaxaCount } from './data_products/TaxaCount';
import createDOMPurify from 'dompurify';
import { marked } from 'marked';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useModalControls } from '../layout/Modal';

const purify = createDOMPurify(window);

export const CollectionOverview: FC<{
  collection_id: string;
  setModalView: SetModalView;
  modal?: ReturnType<typeof useModalControls>;
}> = ({ collection_id, setModalView, modal }) => {
  const navigate = useNavigate();

  const { data: collection, ...collectionQuery } =
    getCollection.useQuery(collection_id);
  if (collectionQuery.isLoading || !collection) return <Loader></Loader>;

  // In this Collection
  const hasGenomes = collection.data_products.find(
    (dp) => dp.product === 'genome_attribs'
  );
  const { data: genomeCount } = getGenomeAttribs.useQuery(
    {
      collection_id: collection_id,
      count: true,
    },
    { skip: !hasGenomes }
  );
  const hasSamples = collection.data_products.find(
    (dp) => dp.product === 'samples'
  );
  const { data: sampleCount } = getSampleAttribs.useQuery(
    {
      collection_id: collection_id,
      count: true,
    },
    { skip: !hasSamples }
  );

  //DPs
  const taxa_count = collection.data_products.find(
    (dp) => dp.product === 'taxa_count'
  );
  const samples = collection.data_products.find(
    (dp) => dp.product === 'samples'
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <h3>Details</h3>
            <Typography
              sx={{ fontSize: 12 }}
              color="text.secondary"
              gutterBottom
            >
              Updated On
            </Typography>
            <div>
              {new Date(collection.date_active).toLocaleString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <br></br>
            <Typography
              sx={{ fontSize: 12 }}
              color="text.secondary"
              gutterBottom
            >
              Source Version
            </Typography>
            <div>{collection.ver_src}</div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={9}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <h3>Description</h3>
            <div>{collection.desc}</div>
            {collection.attribution && (
              <>
                <h4>Attribution</h4>
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked(purify.sanitize(collection.attribution)),
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <h3>In this Collection</h3>
            <Stack direction={'row'} spacing={2}>
              {hasGenomes ? (
                <Card>
                  <CardContent>
                    <Typography
                      sx={{ fontSize: 12 }}
                      color="text.secondary"
                      gutterBottom
                    >
                      Primary Data
                    </Typography>
                    <Button
                      variant="text"
                      href={`/collections/${collection_id}/genome_attribs`}
                      sx={{ padding: '0' }}
                    >
                      <Typography
                        sx={{ fontSize: 24, textTransform: 'none' }}
                        color="primary"
                        gutterBottom
                      >
                        Genomes
                      </Typography>
                    </Button>
                    <Typography color="text.primary">
                      {genomeCount?.count ?? <Loader></Loader>} total
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <></>
              )}

              {hasSamples ? (
                <Card>
                  <CardContent>
                    <Typography
                      sx={{ fontSize: 12 }}
                      color="text.secondary"
                      gutterBottom
                    >
                      Secondary Data
                    </Typography>
                    <Button
                      variant="text"
                      href={`/collections/${collection_id}/samples`}
                      sx={{ padding: '0' }}
                    >
                      <Typography
                        sx={{ fontSize: 24, textTransform: 'none' }}
                        color="primary"
                        gutterBottom
                      >
                        Samples
                      </Typography>
                    </Button>
                    <Typography color="text.primary">
                      {sampleCount?.count ?? <Loader></Loader>} total
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <></>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <h3>Actions</h3>
            <Stack direction={'row'} spacing={2}>
              <Card
                onClick={() => {
                  navigate(`/collections/${collection_id}/genome_attribs`);
                }}
              >
                <CardContent>
                  <strong>Explore</strong> and <strong>filter</strong> genomes
                </CardContent>
                <CardActions sx={{ flexDirection: 'row-reverse' }}>
                  <Button size="small">
                    <FAIcon icon={faArrowRight} size={'2x'} />
                  </Button>
                </CardActions>
              </Card>
              <Card
                onClick={() => {
                  navigate(`/collections/${collection_id}/genome_attribs`);
                  setModalView('match');
                  modal?.show();
                }}
              >
                <CardContent>
                  <strong>Match</strong> collection data with data from a
                  Narrative
                </CardContent>
                <CardActions sx={{ flexDirection: 'row-reverse' }}>
                  <Button size="small">
                    <FAIcon icon={faArrowRight} size={'2x'} />
                  </Button>
                </CardActions>
              </Card>
              <Card
                onClick={() => {
                  navigate(`/collections/${collection_id}/genome_attribs`);
                }}
              >
                <CardContent>
                  <strong>Select</strong> genomes to export
                </CardContent>
                <CardActions sx={{ flexDirection: 'row-reverse' }}>
                  <Button size="small">
                    <FAIcon icon={faArrowRight} size={'2x'} />
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      {taxa_count ? (
        <Grid item xs={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6">Taxa Counts</Typography>}
            />
            <TaxaCount collection_id={collection_id}></TaxaCount>
          </Card>
        </Grid>
      ) : (
        <></>
      )}
      {samples ? (
        <Grid item xs={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6">Sample Preview</Typography>}
            />
            <SampleAttribs
              mapOnly={true}
              collection_id={collection_id}
            ></SampleAttribs>
          </Card>
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};