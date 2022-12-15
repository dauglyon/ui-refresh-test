import { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon as FAIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from '../../../common/hooks';
import { Dropdown } from '../../../common/components/Dropdown';
import { SelectOption } from '../../../common/components/Select';
import {
  keepParamsForLocation,
  narrativePath,
  navigatorParams,
} from '../common';
import { categorySelected, navigatorSelected } from '../navigatorSlice';
import classes from './NarrativeList.module.scss';

type NarrativeItemDropdownProps = {
  narrative: string;
  onVersionSelect: (e: number) => void;
  version: number;
};

const NarrativeItemDropdown: FC<NarrativeItemDropdownProps> = ({
  narrative,
  onVersionSelect,
  version,
}) => {
  const narrativeSelected = useAppSelector(navigatorSelected);
  const categorySet = useAppSelector(categorySelected);
  const navigate = useNavigate();
  const [id, obj, ver] = narrative.split('/');
  const versionLatest = +ver;
  const [versionSelected] = narrativeSelected
    ? narrativeSelected.split('/')
    : [null, null, null];
  const loc = useLocation();
  const keepNavigatorParams = keepParamsForLocation({
    location: loc,
    params: navigatorParams,
  });
  const versionPath = (version: number) => {
    const categoryPath = categorySet !== 'own' ? categorySet : null;
    return keepNavigatorParams(
      narrativePath({
        id,
        obj,
        categoryPath,
        ver: version.toString(),
      })
    );
  };

  const versionIsSelected = (
    version: number,
    versionSelected: string | null
  ) => {
    return versionSelected && version === +versionSelected;
  };
  const versionOptions = Array(versionLatest)
    .fill(null)
    .map((_, n) => n + 1)
    .reverse()
    .map((version) => {
      return {
        options: [
          {
            value: version,
            icon: undefined,
            label: (
              <>
                <span>v{version}</span>
                {versionIsSelected(version, versionSelected) && (
                  <FAIcon icon={faCheck} />
                )}
              </>
            ),
          },
        ],
      };
    });

  const handleDropdownChange = (event: SelectOption[]) => {
    const versionSelected = +event[0].value;
    const path = versionPath(versionSelected);
    onVersionSelect(versionSelected);
    navigate(path);
  };

  return (
    <div
      className={classes.dropdown_wrapper}
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      <Dropdown
        className={classes.version_dropdown}
        horizontalMenuAlign="right"
        options={versionOptions}
        onChange={(e) => handleDropdownChange(e)}
      >
        {versionIsSelected(version, versionSelected) ? (
          <span>v{versionSelected}</span>
        ) : (
          <span>
            v{versionSelected} of {versionLatest}
          </span>
        )}
        <FAIcon icon={faCaretDown} style={{ marginLeft: '5px' }} />
      </Dropdown>
    </div>
  );
};

export default NarrativeItemDropdown;
