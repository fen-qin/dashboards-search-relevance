/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LIGHT_THEME, Axis, Chart, LineSeries, Settings } from '@elastic/charts';
import {
  EuiPanel,
  EuiTitle,
  EuiFlexItem,
  EuiComboBox,
  EuiFilterButton,
  EuiIcon,
  EuiFlexGroup,
  EuiButton,
  EuiPageHeader,
  EuiSpacer,
  EuiSplitPanel, EuiStat, EuiTabbedContent, EuiBasicTable, EuiBasicTableColumn, EuiLink
} from "@elastic/eui";


import { Header } from '../common/header';
import { CoreStart } from '../../../../../src/core/public';
import { TEST_QUERY_ERROR, TEST_QUERY_RESPONSE, TEST_SEARCH_TEXT } from "../../../test/constants";
import { SearchInputBar } from "./search_result/search_components/search_bar";
import { ResultPanel } from "./search_result/result_components/result_panel";
import { SearchRelevanceContextProvider } from "../../contexts";
import { ResultPanels } from "./search_result/result_components/result_components";

type EvaluationResult = {
  name: string;
  precision: number;
  mrr: number;
};

const results: EvaluationResult[] = [];
results.push({
  name: 'querySet_sample01',
  precision: 67,
  mrr: 100
});
results.push({
  name: 'querySet_sample02',
  precision: 67,
  mrr: 50
});
results.push({
  name: 'querySet_sample03',
  precision: 50,
  mrr: 33
});
results.push({
  name: 'querySet_sample04',
  precision: 97,
  mrr: 100
});

const columns: Array<EuiBasicTableColumn<EvaluationResult>> = [
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    truncateText: false,
    mobileOptions: {
      show: false,
    },
  },
  {
    field: 'precision',
    name: 'Precision (%)',
    truncateText: false,
    mobileOptions: {
      show: false,
    },
  },
  {
    field: 'mrr',
    name: 'Mean Reciprocal Rank (%)',
    truncateText: false,
    mobileOptions: {
      show: false,
    },
  }
];

const optionsStatic = [
  {
    label: 'querySet_sample01'
  },
  {
    label: 'querySet_sample02'
  },
  {
    label: 'querySet_sample03'
  },
  {
    label: 'querySet_sample04'
  }
];
const selectedOptions: any[] = [];
selectedOptions.push(optionsStatic.at(0));
selectedOptions.push(optionsStatic.at(1));
selectedOptions.push(optionsStatic.at(2));
selectedOptions.push(optionsStatic.at(3));

const tabs = [
  {
    id: '01',
    name: 'querySet_sample01',
    content: ''
  },
  {
    id: '02',
    name: 'querySet_sample02',
    content: ''
  },
  {
    id: '03',
    name: 'querySet_sample03',
    content: ''
  },
  {
    id: '04',
    name: 'querySet_sample04',
    content: ''
  }
]

export const EvaluationPage = () => {
  return (
    <>
      <Header />
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={2}>
          <EuiPanel paddingSize="l" hasBorder={true} hasShadow={false} grow={false}>
            <EuiPageHeader
              pageTitle="Select all querysets for evaluation"
              rightSideItems={[
                <EuiButton key="evaluate" fill iconType="lensApp" onClick={() => {}}>
                  + Evaluate
                </EuiButton>
              ]}
            />
            <EuiSpacer size="m" />
            <EuiComboBox
              aria-label="Accessible screen reader label"
              placeholder="Select or create options"
              options={optionsStatic}
              selectedOptions={selectedOptions}
              isClearable={true}
              data-test-subj="demoComboBox"
              autoFocus
              fullWidth
            />
            <EuiSpacer size="m" />
            <EuiBasicTable
              color="success"
              tableCaption="Demo of EuiBasicTable"
              items={results}
              rowHeader="firstName"
              columns={columns}
            />
            <Chart size={{height: 200}}>
              <Settings
                baseTheme={LIGHT_THEME}
                showLegend={true}
                legendPosition="right"
                showLegendExtra={false}
              />
              <LineSeries
                id="bars"
                name="0"
                data={[
                  {x: 0, y: 67, g: 'querySet_sample01'},
                  {x: 0, y: 100, g: 'querySet_sample01'},
                  {x: 1, y: 67, g: 'querySet_sample02'},
                  {x: 1, y: 50, g: 'querySet_sample02'},
                  {x: 2, y: 50, g: 'querySet_sample03'},
                  {x: 2, y: 33, g: 'querySet_sample03'},
                  {x: 3, y: 97, g: 'querySet_sample04'},
                  {x: 3, y: 100, g: 'querySet_sample04'}
                ]}
                xAccessor={'x'}
                yAccessors={['y']}
                splitSeriesAccessors={['g']}

              />
              <Axis
                id="bottom-axis"
                position="bottom"
                gridLine={{ visible: true }}
              />
              <Axis
                id="left-axis"
                position="left"
                gridLine={{ visible: true }}
                tickFormat={(d) => Number(d).toFixed(2)}
              />
            </Chart>
          </EuiPanel>
          <EuiTabbedContent
            tabs={tabs}
            initialSelectedTab={tabs[0]}
            autoFocus="selected"
            onTabClick={(tab) => {
              console.log('clicked tab', tab);
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
