export interface Setting {
  key: string;
  displayName: string;
  type: "bool" | "string";
  value: string;
}

export default Setting;
