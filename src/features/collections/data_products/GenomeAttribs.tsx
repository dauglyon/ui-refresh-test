import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { FC, useEffect, useMemo, useState } from 'react';
import { getGenomeAttribs } from '../../../common/api/collectionsApi';
import {
  Pagination,
  Table,
  usePageBounds,
  useTableColumns,
} from '../../../common/components/Table';
import { useAppDispatch } from '../../../common/hooks';
import {
  FilterContext,
  setLocalSelection,
  useCurrentSelection,
  useFilters,
  useGenerateSelectionId,
  useMatchId,
  useSelectionId,
} from '../collectionsSlice';
import classes from './../Collections.module.scss';
import { AttribHistogram } from './AttribHistogram';
import { AttribScatter } from './AttribScatter';
import { Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { formatNumber } from '../../../common/utils/stringUtils';
import { Link } from 'react-router-dom';
import { filterContextMode, useFilterContexts } from '../Filters';

export const GenomeAttribs: FC<{
  collection_id: string;
}> = ({ collection_id }) => {
  // Context
  const dispatch = useAppDispatch();

  // State Management
  const matchId = useMatchId(collection_id);
  const selectionId = useSelectionId(collection_id);
  // get the shared filter state
  const { columnMeta, context } = useFilters(collection_id);

  const [sorting, setSorting] = useState<SortingState>([]);
  const requestSort = useMemo(() => {
    return {
      by: sorting[0]?.id,
      desc: sorting[0]?.desc ?? true,
    };
  }, [sorting]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const currentSelection = useCurrentSelection(collection_id);
  const [selection, setSelection] = [
    useMemo(
      () => Object.fromEntries(currentSelection.map((k) => [k, true])),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [[...currentSelection].sort().join(', ')]
    ),
    (
      updaterOrValue:
        | RowSelectionState
        | ((old: RowSelectionState) => RowSelectionState)
    ) => {
      const value =
        typeof updaterOrValue == 'function'
          ? updaterOrValue(selection)
          : updaterOrValue;
      dispatch(
        setLocalSelection([
          collection_id,
          Object.entries(value)
            .filter(([k, v]) => v)
            .map(([k, v]) => k),
        ])
      );
    },
  ];

  const view = {
    matched: true,
    selected: true,
    filtered: true,
    selection_mark: filterContextMode(context) !== 'selected',
    match_mark: filterContextMode(context) !== 'matched',
  };

  const viewParams = useTableViewParams(collection_id, view);

  // Requests
  const attribParams = useMemo(
    () => ({
      ...viewParams,
      // sort params
      sort_on: requestSort.by,
      sort_desc: requestSort.desc,
      // pagination params
      skip: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
    }),
    [
      viewParams,
      requestSort.by,
      requestSort.desc,
      pagination.pageIndex,
      pagination.pageSize,
    ]
  );

  const selectionTabLoading =
    context === 'genomes.selected' && selectionId === undefined;

  // Current Data
  const { data, isFetching } = getGenomeAttribs.useQuery(attribParams, {
    skip: selectionTabLoading,
  });
  const { count } = useGenomeAttribsCount(collection_id, view, context);
  const { count: allCount } = useGenomeAttribsCount(
    collection_id,
    {
      matched: false,
      selected: false,
      filtered: true,
    },
    'genomes.all'
  );
  const { count: matchedCount } = useGenomeAttribsCount(
    collection_id,
    {
      matched: true,
      selected: false,
      filtered: true,
    },
    'genomes.matched'
  );

  // set filter context tabs
  useFilterContexts(collection_id, [
    { label: 'All', value: 'genomes.all', count: allCount },
    {
      label: 'Matched',
      value: 'genomes.matched',
      count: matchId ? matchedCount : undefined,
      disabled: !matchId,
    },
    {
      label: 'Selected',
      value: 'genomes.selected',
      count: currentSelection.length || undefined,
      disabled: !currentSelection.length,
    },
  ]);

  // Reset Pagination when context changes
  useEffect(() => {
    setPagination((pagination) => ({ ...pagination, pageIndex: 0 }));
  }, [context]);

  // Prefetch requests
  const nextParams = useMemo(
    () => ({
      ...attribParams,
      skip: Math.min(
        (count || pagination.pageSize) - pagination.pageSize,
        attribParams.skip + pagination.pageSize
      ),
    }),
    [attribParams, count, pagination.pageSize]
  );
  getGenomeAttribs.useQuery(nextParams, {
    skip: !data || count === undefined || isFetching,
  });
  const prevParams = useMemo(
    () => ({
      ...attribParams,
      skip: Math.max(0, attribParams.skip - pagination.pageSize),
    }),
    [attribParams, pagination.pageSize]
  );
  getGenomeAttribs.useQuery(prevParams, {
    skip: !data || isFetching,
  });

  // Table setup
  const matchIndex =
    data?.fields.findIndex((f) => f.name === '__match__') ?? -1;
  const idIndex = data?.fields.findIndex((f) => f.name === 'kbase_id') ?? -1;

  const columns = useTableColumns({
    fields: data?.fields.map((field) => ({
      id: field.name,
      displayName: columnMeta?.[field.name]?.display_name ?? field.name,
      options: {
        textAlign: ['float', 'int'].includes(
          columnMeta?.[field.name]?.type ?? ''
        )
          ? 'right'
          : 'left',
      },
      render:
        field.name === 'kbase_id'
          ? (cell) => {
              const upa = (cell.getValue() as string).replace(/_/g, '/');
              return (
                <Link
                  to={`https://ci-europa.kbase.us/legacy/dataview/${upa}`}
                  target="_blank"
                >
                  {upa}
                </Link>
              );
            }
          : field.name === 'classification'
          ? (cell) => {
              return (
                <Tooltip
                  title={`${cell.getValue()}`}
                  placement="top"
                  arrow
                  enterDelay={800}
                >
                  <Typography
                    sx={{
                      direction: 'rtl',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {cell.getValue() as string}
                  </Typography>
                </Tooltip>
              );
            }
          : undefined,
    })),
    order: ['kbase_display_name', 'kbase_id', 'genome_size'],
    exclude: ['__match__', '__sel__'],
  });

  const table = useReactTable<unknown[]>({
    data: data?.table || [],
    getRowId: (row) => String(row[idIndex]),
    columns: columns,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    manualSorting: true,
    onSortingChange: (update) => {
      setPagination((pgn) => ({ ...pgn, pageIndex: 0 }));
      setSorting(update);
    },
    manualPagination: true,
    pageCount: Math.ceil((count || 0) / pagination.pageSize),
    onPaginationChange: setPagination,

    enableRowSelection: true,
    onRowSelectionChange: setSelection,

    state: {
      sorting,
      pagination,
      rowSelection: selection,
    },
  });

  const { firstRow, lastRow } = usePageBounds(table);

  return (
    <Grid container spacing={1}>
      <Grid item md={6}>
        <Paper
          elevation={0}
          sx={{
            height: '350px',
            minWidth: '350px',
            padding: '1px',
            position: 'relative',
            width: '100%',
          }}
        >
          <AttribScatter
            collection_id={collection_id}
            xColumn={
              collection_id === 'GTDB' ? 'checkm_completeness' : 'Completeness'
            }
            yColumn={
              collection_id === 'GTDB'
                ? 'checkm_contamination'
                : 'Contamination'
            }
          />
        </Paper>
      </Grid>
      <Grid item md={6}>
        <Paper
          elevation={0}
          sx={{
            height: '350px',
            minWidth: '350px',
            padding: '1px',
            position: 'relative',
            width: '100%',
          }}
        >
          <AttribHistogram
            collection_id={collection_id}
            column={
              collection_id === 'GTDB' ? 'checkm_completeness' : 'Completeness'
            }
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper elevation={0}>
          <Stack
            className={classes['table-toolbar']}
            direction="row"
            spacing={1}
            justifyContent="space-between"
            alignItems="center"
          >
            <span>
              Showing {formatNumber(firstRow)} - {formatNumber(lastRow)} of{' '}
              {formatNumber(count || 0)} genomes
            </span>
            <Pagination table={table} maxPage={10000 / pagination.pageSize} />
          </Stack>
          <Table
            table={table}
            isLoading={isFetching || selectionTabLoading}
            rowClass={(row) => {
              // match highlights
              return matchIndex !== undefined &&
                matchIndex !== -1 &&
                row.original[matchIndex]
                ? classes['match-highlight']
                : '';
            }}
          />
          <div className={classes['pagination-wrapper']}>
            <Pagination table={table} maxPage={10000 / pagination.pageSize} />
          </div>
        </Paper>
      </Grid>
    </Grid>
  );
};

interface TableView {
  filtered: boolean;
  selected: boolean;
  matched: boolean;
  match_mark?: boolean;
  selection_mark?: boolean;
}

export const useTableViewParams = (
  collection_id: string | undefined,
  view: TableView,
  context?: FilterContext
) => {
  const { filterParams } = useFilters(collection_id, context);
  const matchId = useMatchId(collection_id);
  const selectionId = useGenerateSelectionId(collection_id || '', {
    skip: !collection_id,
  });
  return useMemo(
    () => ({
      collection_id: collection_id ?? '',
      ...(view.filtered ? { ...filterParams } : {}),
      ...(view.selected ? { selection_id: selectionId } : {}),
      ...(view.matched ? { match_id: matchId } : {}),
      match_mark: view.match_mark,
      selection_mark: view.selection_mark,
    }),
    [
      collection_id,
      filterParams,
      matchId,
      selectionId,
      view.filtered,
      view.match_mark,
      view.matched,
      view.selected,
      view.selection_mark,
    ]
  );
};

export const useGenomeAttribsCount = (
  collection_id: string | undefined,
  view: TableView,
  context?: FilterContext
) => {
  const viewParams = useTableViewParams(collection_id, view, context);
  const params = useMemo(() => ({ ...viewParams, count: true }), [viewParams]);

  // Requests
  const result = getGenomeAttribs.useQuery(params, {
    skip: !collection_id,
  });

  return { count: result?.currentData?.count, result };
};
