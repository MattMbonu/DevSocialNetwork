import React, { Fragment } from "react";
import { Redirect, withRouter } from "react-router-dom";
import spinner from "./spinner.gif";

const Spinner = ({ history }) => {
  setTimeout(() => <Redirect to="/fdsdfdsf" />, 1000);
  return (
    <Fragment>
      <img
        src={spinner}
        style={{ width: "200px", margin: "auto", display: "block" }}
        alt="Loading..."
      />
      <button
        onClick={() => history.push("/posts")}
        style={{ margin: "auto", display: "block" }}
        className="btn btn-primary"
      >
        Watching the Spinner Too Long? ("More Than 10s") This Resource is No
        Longer Available Click Here for a Redirect
      </button>
    </Fragment>
  );
};

export default withRouter(Spinner);
