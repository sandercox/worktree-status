export interface Action {
  name: string;
  path: string;
  arguments: string | null;
  icon: string | null;
}

export default Action;
