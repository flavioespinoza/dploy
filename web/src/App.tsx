import React, { lazy, Suspense } from 'react';
import './style/app.css';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import SideNav from './components/SideNav';
import Keplr from './components/KeplrLogin';

// Lazy loading all pages in appropriate time
const Deploy = lazy(() => import("./pages/Deploy"));
const ViewDeployment = lazy(() => import("./pages/ViewDeployment"));
const ReDeploy = lazy(() => import("./pages/ReDeploy"));
const Settings = lazy(() => import("./pages/SettingsPage"));
const MyDeployments = lazy(() => import("./pages/MyDeployments"));
const UpdateDeployment = lazy(() => import("./pages/UpdateDeployment"));
const CustomApp = lazy(() => import("./pages/CustomApp"));
const Provider = lazy(() => import("./pages/Provider"));

const Welcome = () => {
  return (
    <div className="p-12">
      <div className="text-xl font-bold">Welcome to Overclock Console</div>
      <Link to="new-deployment">{`Let's Get Started`}</Link>
    </div>
  );
};

const AppRouter = () => {

  return (
    <Router>
        <SideNav>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="new-deployment">
              <Route path="" element={<Deploy />} />
              <Route path=":folderName/" element={<Deploy />} />
              <Route path=":folderName/:templateId" element={<Deploy />} />
              <Route path=":folderName/:templateId/:intentId" element={<Deploy />} />
              <Route
                path="custom-sdl"
                element={
                  <Keplr>
                    <CustomApp />
                  </Keplr>
                }
              />
            </Route>
            <Route
              path="configure-deployment/:dseq/"
              element={
                <Keplr>
                  <Deploy />
                </Keplr>
              }
            />
            <Route
              path="provider/:providerId"
              element={
                <Keplr>
                  <Provider />
                </Keplr>
              }
            />
            <Route path="my-deployments">
              <Route
                path=""
                element={
                  <Keplr>
                    <MyDeployments />
                  </Keplr>
                }
              />
              <Route
                path=":dseq"
                element={
                  <Keplr>
                    <ViewDeployment />
                  </Keplr>
                }
              />
              <Route
                path=":dseq/update-deployment"
                element={
                  <Keplr>
                    <UpdateDeployment />
                  </Keplr>
                }
              />
              <Route
                path=":dseq/re-deploy"
                element={
                  <Keplr>
                    <ReDeploy />
                  </Keplr>
                }
              />
            </Route>
            <Route
              path="settings"
              element={
                <Keplr>
                  <Settings />
                </Keplr>
              }
            />
          </Routes>
        </SideNav>
    </Router>
  );
};

export default function App() {
  return (
    <Suspense>
      <AppRouter />
    </Suspense>
  );
}
