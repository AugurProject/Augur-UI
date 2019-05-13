import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  MARKET_VOLUME,
  MARKET_CREATION_TIME,
  MARKET_END_DATE,
  MARKET_RECENTLY_TRADED,
  MARKET_FEE,
  MARKET_OPEN_INTEREST
} from "modules/filter-sort/constants/market-sort-params";
import {
  MARKET_OPEN,
  MARKET_REPORTING,
  MARKET_CLOSED
} from "modules/filter-sort/constants/market-states";
import Checkbox from "src/modules/common/components/checkbox/checkbox";
import Dropdown from "modules/common/components/dropdown/dropdown";
import Styles from "modules/filter-sort/components/filter-dropdowns/filter-dropdowns.styles";
import parseQuery from "modules/routes/helpers/parse-query";
import makeQuery from "modules/routes/helpers/make-query";
import { PAGINATION_PARAM_NAME } from "modules/routes/constants/param-names";
import {
  MAX_FEE_02_PERCENT,
  MAX_FEE_05_PERCENT,
  MAX_FEE_100_PERCENT,
  MAX_FEE_10_PERCENT,
  MAX_FEE_20_PERCENT,
  MAX_FEE_30_PERCENT,
  MAX_FEE_40_PERCENT
} from "src/modules/filter-sort/constants/market-max-fees";

const sortOptions = [
  { value: MARKET_CREATION_TIME, label: "Creation Time" },
  { value: MARKET_END_DATE, label: "Reporting Starts" },
  { value: MARKET_RECENTLY_TRADED, label: "Recently Traded" },
  { value: MARKET_VOLUME, label: "Volume" },
  { value: MARKET_FEE, label: "Settlement Fee" },
  { value: MARKET_OPEN_INTEREST, label: "Open Interest" }
];

const filterOptions = [
  { value: MARKET_OPEN, label: "Open" },
  { value: MARKET_REPORTING, label: "In Reporting" },
  { value: MARKET_CLOSED, label: "Resolved" }
];

const maxFeesOptions = [
  { label: "All Fees", value: MAX_FEE_100_PERCENT },
  { label: "Fees < 2%", value: MAX_FEE_02_PERCENT },
  { label: "Fees < 5%", value: MAX_FEE_05_PERCENT },
  { label: "Fees < 10%", value: MAX_FEE_10_PERCENT },
  { label: "Fees < 20%", value: MAX_FEE_20_PERCENT },
  { label: "Fees < 30%", value: MAX_FEE_30_PERCENT },
  { label: "Fees < 40%", value: MAX_FEE_40_PERCENT }
];

export default class FilterSearch extends Component {
  static propTypes = {
    filter: PropTypes.string.isRequired,
    sort: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
    updateFilter: PropTypes.func.isRequired,
    defaultFilter: PropTypes.string.isRequired,
    defaultSort: PropTypes.string.isRequired,
    defaultMaxFee: PropTypes.string.isRequired,
    updateFilterOption: PropTypes.func.isRequired,
    updateSortOption: PropTypes.func.isRequired,
    updateMaxFee: PropTypes.func.isRequired,
    hidePostV2Markets: PropTypes.bool.isRequired,
    updateHidePostV2Markets: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    hasPositionsInCutoffMarkets: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
    this.changeSortDropdown = this.changeSortDropdown.bind(this);
    this.changeFilterDropdown = this.changeFilterDropdown.bind(this);
    this.changeMaxFees = this.changeMaxFees.bind(this);
    this.goToPageOne = this.goToPageOne.bind(this);
    this.changeHidePastCutoff = this.changeHidePastCutoff.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.hasPositionsInCutoffMarkets !==
        this.props.hasPositionsInCutoffMarkets &&
      nextProps.hasPositionsInCutoffMarkets &&
      this.props.hidePostV2Markets
    ) {
      this.changeHidePastCutoff();
    }
  }

  goToPageOne() {
    const { history, location } = this.props;
    let updatedSearch = parseQuery(location.search);

    delete updatedSearch[PAGINATION_PARAM_NAME];
    updatedSearch = makeQuery(updatedSearch);
    history.push({
      ...location,
      search: updatedSearch
    });
  }

  changeSortDropdown(value) {
    const {
      filter,
      updateSortOption,
      updateFilter,
      maxFee,
      hidePostV2Markets
    } = this.props;

    this.goToPageOne();
    updateSortOption(value);
    updateFilter({ filter, sort: value, maxFee, hidePostV2Markets });
  }

  changeFilterDropdown(value) {
    const {
      sort,
      updateFilterOption,
      updateFilter,
      maxFee,
      hidePostV2Markets
    } = this.props;

    this.goToPageOne();
    updateFilterOption(value);
    updateFilter({ filter: value, sort, maxFee, hidePostV2Markets });
  }

  changeMaxFees(maxFee) {
    const {
      sort,
      filter,
      updateMaxFee,
      updateFilter,
      hidePostV2Markets
    } = this.props;

    this.goToPageOne();
    updateMaxFee(maxFee);
    updateFilter({ filter, sort, maxFee, hidePostV2Markets });
  }

  changeHidePastCutoff() {
    const {
      filter,
      sort,
      maxFee,
      updateFilter,
      hidePostV2Markets,
      updateHidePostV2Markets
    } = this.props;
    updateHidePostV2Markets(!hidePostV2Markets);
    updateFilter({
      filter,
      sort,
      maxFee,
      hidePostV2Markets: !hidePostV2Markets
    });
  }

  render() {
    const {
      defaultFilter,
      defaultSort,
      defaultMaxFee,
      hidePostV2Markets
    } = this.props;

    return (
      <div className={Styles.FilterDropdowns}>
        <div>
          <Dropdown
            default={defaultFilter}
            onChange={this.changeFilterDropdown}
            options={filterOptions}
            alignLeft
          />
          <Dropdown
            default={defaultSort}
            onChange={this.changeSortDropdown}
            options={sortOptions}
          />
          <Dropdown
            default={defaultMaxFee}
            onChange={this.changeMaxFees}
            options={maxFeesOptions}
          />
        </div>
        <div className={Styles.FilterDropdowns__hidePastCutoff}>
          <Checkbox
            id="post-cutoff"
            type="checkbox"
            name="hidePostV2Markets"
            isChecked={hidePostV2Markets}
            value={hidePostV2Markets}
            onClick={this.changeHidePastCutoff}
          />{" "}
          <label htmlFor="post-cutoff">
            hide markets ending post v2 cut-off
          </label>
        </div>
      </div>
    );
  }
}
