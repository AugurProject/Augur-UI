import React from "react";

import { CUTOFF_READABLE } from "modules/markets/constants/cutoff-date";
import { AlertIcon } from "modules/common/components/icons";

import Styles from "modules/app/components/global-cutoff-banner/global-cutoff-banner.styles";

const GlobalCutoffBanner = () => (
  <section className={Styles.GlobalCutoffBanner}>
    <div>{AlertIcon}</div>
    <span>
      Due to a planned Augur v2 launch, users are advised not to trade or report
      on any markets that end after {CUTOFF_READABLE}.
    </span>
    <a
      href="http://docs.augur.net"
      target="_blank"
      rel="noopener noreferrer"
    >
      Read more
    </a>
  </section>
);

export default GlobalCutoffBanner;