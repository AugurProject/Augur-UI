"use strict";

var NODE_JS = (typeof module !== "undefined") && process && !process.browser;

var abi = require("augur-abi");
var clone = require("clone");
var constants = require("../libs/constants");
var utilities = require("../libs/utilities");

module.exports = {

  connect: function (hosted) {
    var host, self = this;
    var augur = this.flux.augur;
    var connectHostedCb = function (host) {
      if (!host) {
        return console.error("Couldn't connect to hosted node:", host);
      }
      console.log("connected to host:", augur.rpc.nodes.hosted[0]);
      self.flux.actions.network.checkNetwork();
    };
    if (hosted) {
      this.flux.actions.config.connectHosted(connectHostedCb);
    } else {
      host = this.flux.store("config").getState().host;
      if (!host) {
        return this.flux.actions.config.connectHosted(connectHostedCb);
      }
      augur.rpc.setLocalNode(host);
      augur.connect(host, process.env.GETH_IPC, function (connected) {
        if (connected) {
          console.log("connected to host:", augur.rpc.nodes.local || augur.rpc.nodes.hosted[0]);
          if (!augur.rpc.nodes.local) {
            self.flux.actions.config.setIsHosted(connected);
          }
          return self.flux.actions.network.checkNetwork();
        }
        self.flux.actions.config.connectHosted(connectHostedCb);
      });
    }
  },

  connectHosted: function (cb) {
    var self = this;
    var augur = this.flux.augur;
    augur.rpc.reset();
    augur.connect(null, null, function (connected) {
      if (augur.rpc.nodes.hosted.length > 1) {
        augur.rpc.excision = true;
        augur.rpc.balancer = true;
      } else {
        augur.rpc.excision = false;
        augur.rpc.balancer = false;
      }
      self.flux.actions.config.setIsHosted(connected);
      if (!connected) return cb(false);
      cb(augur.rpc.nodes.hosted[0]);
    });
  },

  setIsHosted: function (isHosted) {
    this.dispatch(constants.config.SET_IS_HOSTED, {isHosted: isHosted});
  },

  setHost: function (host) {
    this.dispatch(constants.config.SET_HOST, {host: host});
  },

  updatePercentLoaded: function (percent) {
    this.dispatch(constants.config.UPDATE_PERCENT_LOADED_SUCCESS, {
      percentLoaded: percent
    });
  },

  // set up filters: monitor the blockchain for changes
  setupFilters: function () {
    var self = this;
    this.flux.augur.filters.listen({

      // listen for new blocks
      block: function (blockHash) {
        if (self.flux.store("config").getAccount()) {
          self.flux.actions.asset.updateAssets();
        }
        self.flux.actions.branch.updateCurrentBranch();
      },

      // listen for augur transactions
      contracts: function (filtrate) {
        if (filtrate && filtrate.address) {
          if (filtrate.error) {
            return console.log("contracts filter error:", filtrate);
          }
          console.log("[filter] contracts:", filtrate.address);
          if (self.flux.store("config").getAccount()) {
            self.flux.actions.asset.updateAssets();
          }
          self.flux.actions.branch.updateCurrentBranch();
        }
      },

      // update market when a price change has been detected
      price: function (result) {
        var marketId, market, markets;
        var account = self.flux.store("config").getAccount();
        console.log("[filter] updatePrice:", result);
        if (result && result.marketId) {
          marketId = abi.bignum(result.marketId);
          self.flux.actions.asset.updateAssets();
          self.flux.actions.market.updatePrice(marketId, function (market) {
            if (result.user === account) {
              if (!market.trades) market.trades = {};
              if (market.trades[result.outcome]) {
                market.trades[result.outcome].push(result);
              } else {
                market.trades[result.outcome] = [result];
              }
            }
            market = self.flux.actions.market.calculatePnl(market);
            markets = self.flux.store("market").getState().markets;
            markets[marketId] = market;
            self.dispatch(constants.market.LOAD_MARKETS_SUCCESS, {
              markets: markets,
              account: account
            });
            self.flux.actions.market.checkOrderBook(market);
          });
        }
      },

      // listen for new markets
      creation: function (result) {
        console.log("[filter] creationBlock:", result);
        if (result && result.marketId) {
          var checks = 0;
          var marketId = abi.bignum(result.marketId);
          self.flux.actions.market.loadMarket(marketId);
        }
      }

    }, function (filters) {
      self.dispatch(constants.config.FILTER_SETUP_COMPLETE, filters);
    });
  },

  teardownFilters: function () {
    var self = this;
    var augur = this.flux.augur;
    var filters = this.flux.store("config").getState().filters;
    if (!filters.price && !filters.creation && !filters.contracts && !filters.block) {
      return this.dispatch(constants.config.FILTER_TEARDOWN_COMPLETE);
    }
    augur.filters.ignore(true, function (err) {
      if (err) console.error("teardown filters:", err);
      self.dispatch(constants.config.FILTER_TEARDOWN_COMPLETE);
    });
  },

  /**
   * Load all application data 
   */
  initializeData: function (marketId) {
    var self = this;
    function initializeData() {
      self.flux.actions.market.loadMarkets();
      self.flux.actions.market.loadOrders();
      self.flux.actions.report.loadEventsToReport();
      self.flux.actions.config.setupFilters();
      self.dispatch(constants.config.LOAD_APPLICATION_DATA_SUCCESS);
    }
    this.flux.actions.branch.loadBranches();
    this.flux.actions.branch.setCurrentBranch();
    if (marketId) {
      this.flux.actions.market.loadMarket(marketId, initializeData);
    } else if (!NODE_JS) {
      var pathname = window.location.pathname.split("/");
      if (pathname && pathname.length > 2 && pathname[2] !== "") {
        marketId = abi.bignum(abi.prefix_hex(pathname[2]));
        if (marketId) {
          this.flux.actions.market.loadMarket(marketId, initializeData);
        } else {
          initializeData();
        }
      } else {
        initializeData();
      }
    } else {
      initializeData();
    }
  },

  updateAccount: function (credentials) {
    this.dispatch(constants.config.UPDATE_ACCOUNT, {
      currentAccount: credentials.currentAccount,
      privateKey: credentials.privateKey,
      handle: credentials.handle,
      keystore: clone(credentials.keystore)
    });
  },

  userRegistered: function () {
    this.dispatch(constants.config.USER_REGISTERED, {});
  },

  signOut: function () {
    this.flux.augur.web.logout();
    this.dispatch(constants.config.USER_SIGNED_OUT, {});
    this.dispatch(constants.config.UPDATE_ACCOUNT, {
      currentAccount: null,
      privateKey: null,
      handle: null,
      keystore: null
    });
    this.flux.actions.asset.updateAssets();
  }
};
