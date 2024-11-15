import React from "react";

import { check, Update } from "@tauri-apps/plugin-updater";

import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";
import { relaunch } from "@tauri-apps/plugin-process";

export const Updater: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = React.useState<Update | null>(
    null
  );
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [progress, setProgress] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const update = await check();
        setUpdateAvailable(update);
      }
      catch (e) {
      }
    };
    checkForUpdate();
  }, []);

  const doUpdate = async () => {
    var downloaded = 0;
    var totalLength: number | undefined = 0;
    await updateAvailable?.download((event) => {
      switch (event.event) {
        case "Started":
          setInProgress(true);
          totalLength = event.data.contentLength;

          setProgress(totalLength !== undefined ? 0 : undefined);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          setProgress(downloaded / totalLength!);
          break;
        case "Finished":
          downloaded = totalLength!;
          setProgress(1);
          break;
      }
    });
    setProgress(undefined);
    await updateAvailable?.install();
    await relaunch();
  };

  if (updateAvailable)
    return (
      <Accordion className="updater" defaultActiveKey={""}>
        <Accordion.Item eventKey={"update-available"}>
          <Accordion.Header className="font-serif">
            Update Available!
          </Accordion.Header>
          <Accordion.Body>
            Update to {updateAvailable.version}
            {updateAvailable.body && (
              <div>
                <h3>Release Notes:</h3>
                {updateAvailable.body}
              </div>
            )}
            <div className="clearfix">
              <Button
                className="float-end"
                size="sm"
                variant="primary"
                onClick={() => doUpdate()}
                disabled={inProgress}
              >
                Update Now
              </Button>
              {inProgress && progress !== undefined && (
                <ProgressBar
                  min={0}
                  max={1}
                  now={progress}
                  onClick={() => setProgress(undefined)}
                />
              )}
              {inProgress && progress === undefined && (
                <ProgressBar
                  onClick={() => setInProgress(false)}
                  min={0}
                  max={1}
                  now={1}
                  animated={true}
                  variant="striped"
                />
              )}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  else return <></>;
};
