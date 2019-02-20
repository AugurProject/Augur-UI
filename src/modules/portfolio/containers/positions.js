import { connect } from "react-redux";
import memoize from "memoizee";

import { selectCurrentTimestamp } from "src/select-state";
import Positions from "modules/portfolio/components/positions/positions";
import getLoginAccountPositions from "modules/positions/selectors/login-account-positions";
import { loadAccountTrades } from "modules/positions/actions/load-account-trades";
import { triggerTransactionsExport } from "modules/transactions/actions/trigger-transactions-export";
import { updateModal } from "modules/modal/actions/update-modal";
import { MODAL_CLAIM_TRADING_PROCEEDS } from "modules/common-elements/constants";

import { createMarketsStateObject } from "modules/portfolio/helpers/create-markets-state-object";

const mapStateToProps = state => {
  const positions = getLoginAccountPositions();

  // NOTE: for data wiring, this should probably be just done as calls for getting openPosition Markets, getting Reporting Markets, and getting Closed Markets respectively from the node and just passed the expected keys below
  const markets = getPositionsMarkets(positions);
  const marketsCount = markets.length;
  const marketsObject = createMarketsStateObject(markets);

  return {
    currentTimestamp: selectCurrentTimestamp(state),
    marketsCount,
    transactionsStatus: state.transactionsStatus,
    markets: marketsObject,
    transactionsLoading: state.appStatus.transactionsLoading,
    registerBlockNumber: state.loginAccount.registerBlockNumber,
    isMobile: state.appStatus.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  loadAccountTrades: () => dispatch(loadAccountTrades()),
  triggerTransactionsExport: () => dispatch(triggerTransactionsExport()),
  claimTradingProceeds: marketId =>
    dispatch(updateModal({ type: MODAL_CLAIM_TRADING_PROCEEDS, marketId }))
});

const getPositionsMarkets = memoize(
  positions => Array.from(new Set([...positions.markets])),
  { max: 1 }
);

const PositionsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Positions);

export default PositionsContainer;
