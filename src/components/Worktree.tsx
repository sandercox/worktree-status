import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { WorktreeStatusContext } from "../contexts/WorktreeStatusContext";
import { DirectoryResult, BranchState } from "../types";
import { Actions } from "./Actions";

interface StateProps {
  name: string;
  icon: string;
  count: number;
}

const State: React.FC<StateProps> = ({ name, icon, count }) => {
  if (count === 0) return <></>;
  return (
    <span title={count + " " + name}>
      {count}
      {icon}
    </span>
  );
};

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
  }, [path, worktreeContext.seed]);

  return (
    <Container fluid className="p-1 worktree">
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
                <State name="behind" icon="↓" count={branchState.behind} />
                <State name="ahead" icon="↑" count={branchState.ahead} />
                <State name="staged" icon="✔" count={branchState.staged} />
                {/* <State name="added" icon="+" count={branchState.added} /> */}
                <State name="modified" icon="±" count={branchState.modified} />
                <State name="deleted" icon="⦸" count={branchState.deleted} />
                <State
                  name="untracked"
                  icon="?"
                  count={branchState.untracked}
                />
                <State name="conflict" icon="⨂" count={branchState.conflict} />
              </div>
            </>
          ) || "Loading..."}
          {error && <>{error}</>}
        </Col>
        <Col className="me-auto text-end">
          <Actions path={path} />
        </Col>
      </Row>
    </Container>
  );
};
