import React from "react";
import { Helmet } from "react-helmet-async";

// custom component

const Meta = ({ title, description, keywords }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="descriptions" content={description} />
      <meta name="keywords" content={keywords} />
    </Helmet>
  );
};

Meta.defaultProps = {
  title: "Welcome to PrimeShop",
  description: "We sell best products for cheap",
  keywords: "electronics, buy electronics, cheap electronics",
};

export default Meta;
