/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiPageTemplate,
  EuiPanel,
  EuiSpacer,
  EuiResizableContainer,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import {
  reactRouterNavigate,
  TableListView,
} from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { CoreStart } from '../../../../../src/core/public';
import { ServiceEndpoints } from '../../../common';
import {
  VisualComparison,
  convertFromSearchResult,
} from '../query_compare/search_result/visual_comparison/visual_comparison';
import { SearchResults } from '../../types/index';
import { EvaluationMetricsTable } from './evaluation_metrics_table';

interface ExperimentViewProps extends RouteComponentProps<{ id: string }> {
  http: CoreStart['http'];
}

export const ExperimentView: React.FC<ExperimentViewProps> = ({ http, id, history }) => {
  const [experiment, setExperiment] = useState<any | null>(null);
  const [searchConfigurations, setSearchConfigurations] = useState<any | null>(null);
  const [querySet, setQuerySet] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<number | null>(null);
  const [queryResult1, setQueryResult1] = useState<SearchResults | null>(null);
  const [queryResult2, setQueryResult2] = useState<SearchResults | null>(null);

  // Detailed experiment details
  const [queryEntries, setQueryEntries] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<any[]>([]);

  const [queries, setQueries] = useState<any[]>([]);

  const sanitizeResponse = (response) => response?.hits?.hits?.[0]?._source || undefined;

  const loadSearchConfigurations = async (searchConfigurationIds: string[]) => {
    const promises = searchConfigurationIds.map(async (id) => {
      return await http
        .get(ServiceEndpoints.SearchConfigurations + '/' + id)
        .then(sanitizeResponse);
    });
    return Promise.all(promises);
  };

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        setLoading(true);
        const _experiment = await http
          .get(ServiceEndpoints.Experiments + '/' + id)
          .then(sanitizeResponse);
        const _searchConfigurations = _experiment
          ? await loadSearchConfigurations(_experiment.searchConfigurationList)
          : [];
        const _querySet = _experiment
          ? await http
              .get(ServiceEndpoints.QuerySets + '/' + _experiment.querySetId)
              .then(sanitizeResponse)
          : null;

        if (
          _experiment &&
          _searchConfigurations.length >= 2 &&
          _searchConfigurations.every(Boolean)
        ) {
          setExperiment(_experiment);
          setSearchConfigurations(_searchConfigurations);
          setQuerySet(_querySet);
        } else {
          setError('No matching experiment found');
        }
      } catch (err) {
        setExperiment(null);
        setError('Error loading experiment data');
        console.error(err);
      } finally {
      }
    };

    fetchExperiment();
  }, [http, id]);

  function extractMetricNames(
    obj: any
  ): { pairwiseMetrics: string[]; evaluationMetrics: string[] } {
    const metrics = obj?.results?.metrics;
    if (metrics) {
      const key0 = Object.keys(metrics)[0];
      const queryMetrics = metrics[key0];
      return {
        pairwiseMetrics: queryMetrics.pairwiseComparison
          ? Object.keys(queryMetrics.pairwiseComparison)
          : [],
        evaluationMetrics: queryMetrics.evaluation ? Object.keys(queryMetrics.evaluation) : [],
      };
    }
    return { pairwiseMetrics: [], evaluationMetrics: [] };
  }

  useEffect(() => {
    if (experiment) {
      setQueries(experiment.results.queryTexts);
      const _metricMeans = {};
      let _queryEntries = [];
      const columns = [
        {
          field: 'queryText',
          name: 'Query',
          dataType: 'string',
          sortable: true,
          render: (name: string, queryEntry: { index: number }) => (
            <EuiButtonEmpty size="xs" onClick={() => setSelectedQuery(queryEntry.index)}>
              {name}
            </EuiButtonEmpty>
          ),
        },
      ];

      const { pairwiseMetrics, evaluationMetrics } = extractMetricNames(experiment);

      if (pairwiseMetrics.length > 0) {
        // Process pairwise comparison metrics
        _queryEntries = experiment.results.queryTexts.map((t, index) => ({
          queryText: t,
          queryResults: {},
          metrics: {},
          index,
        }));

        pairwiseMetrics.forEach((metricName) => {
          const vals = experiment.results.queryTexts.map(
            (q) => experiment.results.metrics[q].pairwiseComparison[metricName]
          );
          vals.forEach((val, i) => {
            _queryEntries[i].metrics[metricName] = val;
          });
          _metricMeans[metricName] = vals.reduce((a, b) => a + b, 0) / vals.length;
        });

        // Store query results
        experiment.results.queryTexts.forEach((queryText, i) => {
          ['0', '1'].forEach((queryName) => {
            const queryResults = experiment.results.metrics[queryText][queryName];
            _queryEntries[i].queryResults[queryName] = queryResults;
          });
        });

        const cheatColNames = {
          rbo90: 'RBO@' + experiment.k,
          jaccard: 'Jaccard@' + experiment.k,
        };
        Object.keys(_metricMeans).forEach((metricName) => {
          if (cheatColNames[metricName]) {
            columns.push({
              field: 'metrics.' + metricName,
              name: cheatColNames[metricName],
              dataType: 'number',
              sortable: true,
              render: (value) => {
                if (value !== undefined && value !== null) {
                  return new Intl.NumberFormat(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(value);
                }
                return '-';
              },
            });
          }
        });
      } else if (evaluationMetrics.length > 0) {
        // Process evaluation metrics
        _queryEntries = experiment.results.queryTexts.map((t, index) => ({
          queryText: t,
          queryResults: {},
          metrics: {},
          evaluation: experiment.results.metrics[t].evaluation || {},
          index,
        }));

        const cheatColNames = ['precision@5', 'precision@10', 'ndcg', 'MAP'];
        cheatColNames.forEach((metric) => {
          columns.push({
            field: `evaluation.0.${metric}`,
            name: `${metric} (Config 0)`,
            dataType: 'number',
            sortable: true,
            render: (value) => {
              if (value !== undefined && value !== null) {
                return new Intl.NumberFormat(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(value));
              }
              return '-';
            },
          });
        });
      }

      setQueryEntries(_queryEntries);
      setTableColumns(columns);
      setLoading(false);
    }
  }, [experiment]);

  function resolve_attributes(ids, hits) {
    const res = ids.map((id) => hits.find((hit) => hit._id === id) || { _id: id });
    return res.map((x, index) => ({ ...x, rank: index + 1 }));
  }

  useEffect(() => {
    const { pairwiseMetrics } = extractMetricNames(experiment);
    if (selectedQuery != null && pairwiseMetrics.length > 0) {
      const query1 = {
        index: searchConfigurations[0].index,
        query: {
          ids: {
            values: queryEntries[selectedQuery].queryResults['0'],
          },
        },
      };

      const query2 = {
        index: searchConfigurations[1].index,
        query: {
          ids: {
            values: queryEntries[selectedQuery].queryResults['1'],
          },
        },
      };

      http
        .post(ServiceEndpoints.GetSearchResults, {
          body: JSON.stringify({ query1, query2 }),
        })
        .then((res) => {
          console.log('Search response:', res);

          // Debug logs
          console.log('Query results before conversion:', {
            result1: res.result1,
            result2: res.result2,
          });

          const resolved1 = resolve_attributes(
            queryEntries[selectedQuery].queryResults['0'],
            convertFromSearchResult(res.result1)
          );

          const resolved2 = resolve_attributes(
            queryEntries[selectedQuery].queryResults['1'],
            convertFromSearchResult(res.result2)
          );

          console.log('After resolve_attributes:', {
            resolved1,
            resolved2,
            queryEntries0: queryEntries[selectedQuery].queryResults['0'],
            queryEntries1: queryEntries[selectedQuery].queryResults['1'],
          });

          setQueryResult1(resolved1);
          setQueryResult2(resolved2);
        })
        .catch((error: Error) => {
          console.error('Search error:', error);
        });
    }
  }, [selectedQuery, experiment, searchConfigurations]);

  const findQueries = async (search: any) => {
    const filteredQueryEntries = search
      ? queryEntries.filter((q) => q.queryText.includes(search))
      : queryEntries;
    return { hits: filteredQueryEntries, total: filteredQueryEntries.length };
  };

  const experimentDetails = (
    <EuiPanel hasBorder={true}>
      <EuiDescriptionList type="column" compressed>
        <EuiDescriptionListTitle>Query Set</EuiDescriptionListTitle>
        <EuiDescriptionListDescription>
          <EuiButtonEmpty
            size="xs"
            {...reactRouterNavigate(history, `/querySet/view/${querySet?.id}`)}
          >
            {querySet?.name}
          </EuiButtonEmpty>
        </EuiDescriptionListDescription>
        {searchConfigurations?.map((config, index) => (
          <React.Fragment key={config.id}>
            <EuiDescriptionListTitle>Search Configuration {index + 1}</EuiDescriptionListTitle>
            <EuiDescriptionListDescription>
              <EuiButtonEmpty
                size="xs"
                {...reactRouterNavigate(history, `/searchConfiguration/view/${config.id}`)}
              >
                {config.name}
              </EuiButtonEmpty>
            </EuiDescriptionListDescription>
          </React.Fragment>
        ))}
      </EuiDescriptionList>
    </EuiPanel>
  );

  const resultsPane = (
    <EuiPanel hasBorder paddingSize="l">
      <EuiResizableContainer>
        {(EuiResizablePanel, EuiResizableButton) => {
          return (
            <>
              <EuiResizablePanel initialSize={50} minSize="15%">
                {error ? (
                  <EuiCallOut title="Error" color="danger">
                    <p>{error}</p>
                  </EuiCallOut>
                ) : (
                  <TableListView
                    entityName="Query"
                    entityNamePlural="Queries"
                    tableColumns={tableColumns}
                    findItems={findQueries}
                    loading={loading}
                    pagination={{
                      initialPageSize: 10,
                      pageSizeOptions: [5, 10, 20, 50],
                    }}
                    search={{
                      box: {
                        incremental: true,
                        placeholder: 'Query...',
                        schema: true,
                      },
                    }}
                  />
                )}
              </EuiResizablePanel>
              <EuiResizableButton />

              <EuiResizablePanel initialSize={50} minSize="30%">
                {selectedQuery != null && queryResult1 && queryResult2 && (
                  <VisualComparison
                    queryResult1={queryResult1}
                    queryResult2={queryResult2}
                    queryText={queryEntries[selectedQuery].queryText}
                    resultText1={`${searchConfigurations[0].name} result`}
                    resultText2={`${searchConfigurations[1].name} result`}
                  />
                )}
                {selectedQuery !== null &&
                  experiment &&
                  extractMetricNames(experiment).evaluationMetrics.length > 0 && (
                    <EuiPanel hasBorder paddingSize="l">
                      <EuiFlexGroup direction="column" gutterSize="m">
                        <EuiFlexItem>
                          <EvaluationMetricsTable
                            queryText={queries[selectedQuery]}
                            metrics={experiment.results.metrics[queries[selectedQuery]]}
                            judgments={experiment.results.metrics[queries[selectedQuery]].judgments}
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiPanel>
                  )}
              </EuiResizablePanel>
            </>
          );
        }}
      </EuiResizableContainer>
    </EuiPanel>
  );

  return (
    <EuiPageTemplate paddingSize="l" restrictWidth="90%">
      <EuiPageHeader pageTitle="Experiment Visualization" />
      {experimentDetails}
      <EuiSpacer size="l" />
      {resultsPane}
    </EuiPageTemplate>
  );
};

export const ExperimentViewWithRouter = withRouter(ExperimentView);

export default ExperimentViewWithRouter;
