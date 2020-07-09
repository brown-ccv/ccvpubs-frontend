import React, { Component } from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import * as actions from "../actions";
import { connect } from "react-redux";
import * as selectors from "../reducer";
import Immutable from "seamless-immutable";
import DoiInfo from "./DoiInfo";
import Spinner from "./Spinner";
import Keycloak from "keycloak-js";
import Form from "react-bootstrap/Form";

let KEYCLOAK_USER =  {
  realm : "ccv-shib",
  url : "https://datasci.brown.edu/keycloak/auth/",
  clientId: "ccvpubs-app-test"
}
if (process.env.NODE_ENV === "production")
  KEYCLOAK_USER["clientId"] = "ccvpubs-app"

export class AddPub extends Component {
  constructor(props) {
    super(props);
    const newDoiInfo = {
      data: {},
      status: "empty",
    };
    this.props.changeDoiInfo(newDoiInfo);
    this.doi = "";
    this.full = true;
    this.props.changeYear(null);
    this.token = null;
  }

  componentDidMount() {
    /**
     * User is authenticated as a member of CIS when routed to AddPub component. User is
     * only authenticated once when using the app, unless they have logged out. 
     */
    this.props.changeLoading(false)
    if (!this.props.keycloak["authenticated"]) {
      var temp = Immutable.asMutable(this.props.keycloak, { deep: true });
      //pass an object instead of file(change client id )
      const keycloak = Keycloak(KEYCLOAK_USER);
      
      keycloak
        .init({ onLoad: "login-required" })
        .then((authenticated) => {
          temp["keycloak"] = keycloak;
          temp["authenticated"] = authenticated;
          this.token = keycloak["token"]
          this.props.changeKeycloak(temp);
          keycloak
            .loadUserProfile()
            .then((profile) => {
              temp["profile"] = profile;
              this.props.changeKeycloak(temp);
            })
            .catch((err) => console.log(err));
          let hasRole = keycloak.hasRealmRole("cis-all-role");
          temp["iscis"] = hasRole;
          this.props.changeKeycloak(temp);
        })
        .catch((err) => console.log(err));
    }
  }

  /**
   * When a user submits a DOI for fetch from CrossRef API. Erases 
   * current DOI info if there is any and requests info.
   */
  onSubmit(e) {
    e.preventDefault();
    this.props.setFailure(false);
    const newDoiInfo = {
      data: {},
      status: "empty",
    };
    this.props.changeDoiInfo(newDoiInfo);
    const doiObject = {
      doi: this.doi,
    };
    this.props.requestDoiInfo(doiObject);
    this.data = Immutable.asMutable(this.props.doiInfo, { deep: true });
    this.props.changePressed(true);
    this.props.changeLoading(true);
    this.props.changeManual(false);
    this.props.changeError(null)
  }

  /**
   * Called after a user recieves the information from the requested DOI and has
   * had the oppurtunity to edit before submitting to be added to the database or 
   * elected to submit manually.
   * 
   * If submitting manually, doi and title must be specified 
   */
  onContinue(e) {
    e.preventDefault();
    var data = this.props.doiInfo;
    const dataObject = {
      data: data,
      token: this.token
    };

    if (
      data["data"]["doi"] !== null &&
      data["data"]["doi"] !== "" &&
      data["data"]["title"] !== null &&
      data["data"]["title"] !== ""
    ) {
      this.full = true;
    } else {
      this.full = false;
      this.forceUpdate();
    }

    if (this.full) {
      this.props.changeLoading(true);
      console.log(data["data"])
      this.props.postPubAction(dataObject);
    }
  }

  /**
   * Called when "Back to Home button is pressed"
   */
  onCancel(e) {
    const newDoiInfo = {
      data: {},
      status: "empty",
    };
    this.props.changeDoiInfo(newDoiInfo);
    this.props.history.push("/");
    this.props.setFailure(false);
    this.props.changeAddSuccess(false);
    this.props.changeManual(false);
  }

  /**
   * When a user elects to add a publication manually,
   * the previous doi info (if any) is cleared
   */
  onManual(e) {
    const newDoiInfo = {
      data: {
        title: null,
        author: null,
        publisher: null,
        doi: null,
        url: null,
        abstract: null,
        volume: null,
        month: null,
        year: null,
      },
      status: "empty",
    };
    this.props.setFailure(false);
    this.data = [];
    this.props.changeDoiInfo(newDoiInfo);
    this.props.changeManual(true);
  }

  /**
   * When a user elects to enter a DOI after previosly pressing 
   * "enter manually". 
   */
  onDOI(e) {
    const newDoiInfo = {
      data: {},
      status: "empty",
    };
    this.props.setFailure(false);
    this.props.changeDoiInfo(newDoiInfo);
    this.props.changeManual(false);
    this.props.changeAddSuccess(false);
  }

  /**
   * When a user logs out everything in props is reset and
   * any class variables are reverted back to oringinal state
   */
  onLogout(e) {
    const newDoiInfo = {
      data: {},
      status: "empty",
    };
    this.props.setFailure(false);
    this.props.changeDoiInfo(newDoiInfo);
    this.props.changeManual(false);
    this.props.changeAddSuccess(false);
    this.props.history.push("/");
    this.props.keycloak["keycloak"].logout();
  }

  render() {
    //main div is only displayed if user is authenticated by shib and in CIS group
    if (this.props.keycloak["keycloak"]) {
      if (this.props.keycloak["authenticated"]) {
        if (this.props.keycloak["iscis"]) {
          if (this.props.keycloak["profile"]) {
        return (
          <div id = "AddPub">

              <Navbar id = "navbar-addPub" bg="primary">
                
                    <Navbar.Brand className="navbar-brand-custom">
                      Add a Publication
                    </Navbar.Brand>
                  
                <Nav className="ml-auto mr-1">
                  <Nav.Item>
                    <Button
                      variant="outline-primary"
                      onClick={(event) => this.onLogout(event)}
                    >
                      Logout
                    </Button>
                  </Nav.Item>
                </Nav>
              </Navbar>

              {!this.props.addSuccess && (
                <div id = "body">
                  <br />
                  {!this.props.manual && (
                    <div className="doi-width">
                      <Form>
                        <Form.Group controlId="doientry">
                          <Form.Label>Please enter a DOI or DOI URL</Form.Label>
                          <Form.Control
                            type="doi"
                            placeholder="Enter DOI or URL"
                            onChange={(event) => {
                              this.doi = event.target.value;
                            }}
                          />
                        </Form.Group>
                      </Form>

                      <br />
                      <Spinner
                        loading={this.props.loading}
                        className="spinner"
                        size={100}
                      />
                      {
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={(event) => this.onSubmit(event)}
                        >
                          Submit
                        </Button>
                      }
                    </div>
                  )}
                  <br /> <br />
                  {this.props.doiInfo["status"] !== "empty" &&
                    this.props.doiInfo["status"] !== "not found" && (
                      <DoiInfo></DoiInfo>
                    )}
                  {this.props.manual && <DoiInfo></DoiInfo>}
                  {this.props.doiFailure && <p>No Information Found</p>}
                  {this.props.error && <div className = "error-text">
                    <h1>{this.props.error}</h1>
                  </div>}
                  <br />
                  {this.props.doiInfo["status"] === "new" && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(event) => this.onContinue(event)}
                    >
                      Continue with Submission
                    </Button>
                  )}
                  {this.props.doiInfo["status"] === "old" && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(event) => this.onContinue(event)}
                    >
                      Insert Edited Publication Information
                    </Button>
                  )}
                  {!this.full && (
                    <p>Please enter at least DOI and Title</p>
                  )}
                  {this.props.manual && (
                    <div>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={(event) => this.onContinue(event)}
                      >
                        Submit
                      </Button>
                      <Spinner
                        loading={this.props.loading}
                        className="spinner"
                        size={100}
                      />
                    </div>
                  )}
                  <br /> <br />
                  <p>OR</p>
                  {/* <Link to="/doiinfo"> */}
                  {!this.props.manual && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(event) => this.onManual(event)}
                    >
                      Enter Manually
                    </Button>
                  )}
                  {this.props.manual && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(event) => this.onDOI(event)}
                    >
                      Enter DOI
                    </Button>
                  )}
                  <div className="divider" />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={(event) => this.onCancel(event)}
                  >
                    Back to Home
                  </Button>
                </div>
              )}

              {this.props.addSuccess && (
                <div>
                  <h1>Success!</h1>
                  <br />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={(event) => this.onDOI(event)}
                  >
                    Insert Another Publication
                  </Button>
                  <div className="divider" />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={(event) => this.onCancel(event)}
                  >
                    Back to Home
                  </Button>
                </div>
              )}
          </div>
        );
          } else {
            return (<div>Loading Profile</div>)
          }
        } else {

          return (<div className = "cis-false">
          <div>Only members of CIS can do this - <a href = "mailto:support@ccv.brown.edu">open a ticket </a>to request your publication be added</div>
              </div>
            )
        }
      } else {
        return <div>Unable to authenticate!</div>;
      }
    }
    return <div>Initializing Keycloak...</div>;
  }
}


function mapStateToProps(state) {
  return {
    doiInfo: selectors.getDoiInfo(state),
    loading: selectors.getLoading(state),
    error: selectors.getError(state),
    keycloak: selectors.getKeycloak(state),
    doiFailure: selectors.getDoiFailure(state),
    addSuccess: selectors.getAddSuccess(state),
    manual: selectors.getManual(state),
    pressed: selectors.getPressed(state)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    postPubAction: (newPub) => dispatch(actions.postPubAction(newPub)),
    requestDoiInfo: (newPub) => dispatch(actions.requestDoiInfo(newPub)),
    changeLoading: (val) => dispatch(actions.changeLoading(val)),
    changeKeycloak: (val) => dispatch(actions.changeKeycloak(val)),
    changeDoiInfo: (val) => dispatch(actions.changeDoiInfo(val)),
    setFailure: (val) => dispatch(actions.changeDoiFailure(val)),
    changeError: (val) => dispatch(actions.changeError(val)),
    changeAddSuccess: (val) => dispatch(actions.changeAddSuccess(val)),
    changeManual: (val) => dispatch(actions.changeManual(val)),
    changePressed: (val) => dispatch(actions.changePressed(val)),
    changeYear: (val) => dispatch(actions.changeYear(val))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AddPub);
