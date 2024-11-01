import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { WorktreeStatusContext } from "../contexts/WorktreeStatusContext";
import { DirectoryResult, BranchState } from "../types";
import { Actions } from "./Actions";

export const Worktree: React.FC<DirectoryResult> = ({ name, path }) => {
  const [branchState, setBranchState] = React.useState<BranchState | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);

  const worktreeContext = React.useContext(WorktreeStatusContext);

  React.useEffect(() => {
    var setState = true;
    async function getBranchState(path: string) {
      const state = (await worktreeContext
        .get_branch_state(path)
        .catch((oeps: string) => setError(oeps))) as BranchState;
      if (state !== undefined) {
        if (setState) setBranchState(state);
      }
    }
    getBranchState(path);
    return () => {
      setState = false;
    };
  }, [path]);

  return (
    <Container fluid className="p-0 worktree">
      <Row>
        <Col>
          <h3 title={path} aria-label={path}>
            {name}
          </h3>
        </Col>
        <Col className="state">
          {branchState !== null && (
            <>
              <div title={branchState.branch} aria-label={branchState.branch}>
                {branchState.branch}
              </div>
              <div>
                {branchState.behind > 0 && (
                  <span title={branchState.behind + " behind"}>
                    {branchState.behind}↓{" "}
                  </span>
                )}
                {branchState.ahead > 0 && <>{branchState.ahead}↑ </>}
                {branchState.staged > 0 && <>{branchState.staged}✔ </>}
                {branchState.added > 0 && <>{branchState.added}+ </>}
                {branchState.modified > 0 && <>{branchState.modified}± </>}
                {branchState.deleted > 0 && <>{branchState.deleted}⦸ </>}
                {branchState.untracked > 0 && <>{branchState.untracked}? </>}
                {branchState.conflict > 0 && <>{branchState.conflict}⨂ </>}
              </div>
            </>
          )}
          {error && <>{error}</>}
        </Col>
        <Col className="me-auto text-end">
          <Actions path={path} />
        </Col>
      </Row>
    </Container>
  );
};

// import React from "react";
// import Shortcut from "./Shortcut";

// export interface Action {
//     name: string;
//     icon: string;
// }

// interface WorkreeProps {
//     name: string;
//     refName: string;
//     status: string;
//     actions: Action[];

//     onAction: (action: Action) => void;
// }

// const WorktreeDisplay: React.FC<WorkreeProps> = ({ name, refName, status, actions, onAction }) => {
//     return (
//         <div>
//             <h2>{name}</h2>
//             <h3>{refName}</h3>
//             <h4>{status}</h4>
//             <div>
//                 {actions.map((action, index) => (
//                     <Shortcut key={index} name={action.name} icon={action.icon} onClick={() => onAction(action)} />
//                 ))}
//             </div>
//         </div>
//     )
// }

// export const Worktree: React.FC<{ path: string }> = ({ path }) => {
//     return (
//         <div><h2>{path}</h2></div>
//     )
// };
// export default Worktree;
