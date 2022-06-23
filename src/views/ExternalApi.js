import React, { useState } from "react";
import { Button, Alert, Nav } from "reactstrap";
import Highlight from "../components/Highlight";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { getConfig } from "../config";
import Loading from "../components/Loading";
import jwt_decode from "jwt-decode";

export const ExternalApiComponent = () => {
  const { apiOrigin = "http://localhost:3001", audience } = getConfig();

  const [isAuthorized, setIsAuthorized] = useState(false);

  const [state, setState] = useState({
    showResult: false,
    apiMessage: "",
    error: null,
    accessToken: "",
    tokenExpiration: 0,
    accessTokenUnixTime: 0,
    tokenAudience: [],
    wrongATMessage: false,
    decodedJWT: {},

  });

  const {
    getAccessTokenSilently,
    loginWithPopup,
    getAccessTokenWithPopup,
  } = useAuth0();

  const handleConsent = async () => {
    try {
      await getAccessTokenWithPopup();
      setState({
        ...state,
        error: null,
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error,
      });
    }

    await callApi();
    await loginWithPopup();
  };

  const handleLoginAgain = async () => {
    try {
      await loginWithPopup();
      setState({
        ...state,
        error: null,
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error,
      });
    }

    await callApi();
    await callApiWrongAccessToken();
  };

  const callApi = async () => {
    try {
      const token = await getAccessTokenSilently();
      var decoded = jwt_decode(token);
      const decodedExpiration = decoded.exp;
      const decodedAudience = decoded.aud;
      console.log("Decoded Access Token", decoded);

      const timeUntilExpiration =
      decodedExpiration - Math.floor(Date.now() / 1000);

      const response = await fetch(`${apiOrigin}/api/external`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      setState({
        ...state,
        showResult: true,
        apiMessage: responseData,
        accessToken: token,
        decodedJWT: decoded,
        tokenExpiration: timeUntilExpiration,
        accessTokenUnixTime: decodedExpiration,
        tokenAudience: decodedAudience[0],
      });
      setIsAuthorized(true);
    } catch (error) {
      setIsAuthorized(false);
      setState({
        ...state,
        error: error.error,
      });
    }
  };

  const callApiWrongAccessToken = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: "https://wrong-account-api.com/",
      });
      const decoded = jwt_decode(token);
      const decodedAudience = decoded.aud;
      console.log("Invalid AT: ", decoded);
      console.log("AT Audience: ", decodedAudience[0]);

      const response = await fetch(`${apiOrigin}/api/external`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      setState({
        ...state,
        apiMessage: responseData,
      });
      setIsAuthorized(false);
    } catch (error) {
      setIsAuthorized(false);
      setState({
        ...state,
        wrongATMessage: true,
        error: error.error,
        showResult: true,
      });
    }
  };

  const handle = (e, fn) => {
    e.preventDefault();
    fn();
  };

  return (
    <>
      <div className="mb-5">
        {state.error === "consent_required" && (
          <Alert color="warning">
            You need to{" "}
            <a
              href="#/"
              class="alert-link"
              onClick={(e) => handle(e, handleConsent)}
            >
              consent to get access to users api
            </a>
          </Alert>
        )}

        {state.error === "login_required" && (
          <Alert color="warning">
            You need to{" "}
            <a
              href="#/"
              class="alert-link"
              onClick={(e) => handle(e, handleLoginAgain)}
            >
              log in again
            </a>
          </Alert>
        )}

        <h1>External API</h1>
        <p className="lead">
          Ping an external API by clicking the button below.
        </p>

        <p>
          This will call a local API on port 3001 that would have been started
          if you run <code>npm run dev</code>. An access token is sent as part
          of the request's `Authorization` header and the API will validate it
          using the API's audience value.
        </p>

        {!audience && (
          <Alert color="warning">
            <p>
              You can't call the API at the moment because your application does
              not have any configuration for <code>audience</code>, or it is
              using the default value of <code>YOUR_API_IDENTIFIER</code>. You
              might get this default value if you used the "Download Sample"
              feature of{" "}
              <a href="https://auth0.com/docs/quickstart/spa/react">
                the quickstart guide
              </a>
              , but have not set an API up in your Auth0 Tenant. You can find
              out more information on{" "}
              <a href="https://auth0.com/docs/api">setting up APIs</a> in the
              Auth0 Docs.
            </p>
            <p>
              The audience is the identifier of the API that you want to call
              (see{" "}
              <a href="https://auth0.com/docs/get-started/dashboard/tenant-settings#api-authorization-settings">
                API Authorization Settings
              </a>{" "}
              for more info).
            </p>

            <p>
              In this sample, you can configure the audience in a couple of
              ways:
            </p>
            <ul>
              <li>
                in the <code>src/index.js</code> file
              </li>
              <li>
                by specifying it in the <code>auth_config.json</code> file (see
                the <code>auth_config.json.example</code> file for an example of
                where it should go)
              </li>
            </ul>
            <p>
              Once you have configured the value for <code>audience</code>,
              please restart the app and try to use the "Ping API" button below.
            </p>
          </Alert>
        )}
        <div className="justify-content-between">
        <Button
          color="primary"
          className="mt-5"
          onClick={callApi}
          disabled={!audience}
          
        >
          Get Access Token for External API
        </Button>
        <br />
          <Button
            color="danger"
            className="mt-5"
            onClick={callApiWrongAccessToken}
            disabled={!audience}
          >
          Get Access Token for Internal API
          </Button>
          </div>
      </div>
      {isAuthorized && (
      <div className="result-block-container" href="#!">
        {state.showResult && (
          <div className="result-block" data-testid="api-result">
            <h6 className="muted">Result</h6>
           
            <Highlight>
              <span>{JSON.stringify(state.apiMessage, null, 4)}</span>
              {/* <span>{JSON.stringify(state.accessToken, null, 2)}</span> */}
               </Highlight>
             

    
        <Highlight>
          <Nav>
          <span>{JSON.stringify(state.accessToken, null, 4)}</span>
          </Nav>
          </Highlight>
         



            <Highlight>
              {/* <span>{JSON.stringify(state.apiMessage, null, 2)}</span> */}
              {/* <span>{JSON.stringify(state.accessToken, null, 2)}</span> */}
              <span>{JSON.stringify(state.decodedJWT, null, 4)}</span>
            
            </Highlight> 
          </div>
        )}
      </div>
      )}
            {state.wrongATMessage && (
        <div className="result-block-containerInvalid">
          <div className="invalidToken">
            Unauthorized! Sorry, you don't have permission to access this API
          </div>
        </div>
      )}
    </>
  );
};




export default withAuthenticationRequired(ExternalApiComponent, {
  onRedirecting: () => <Loading />,
});
