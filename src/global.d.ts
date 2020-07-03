// So we can import CSS modules.
declare module "*.sass";
declare module "*.scss";
declare module "*.svg" {
  const content: any;
  export default content;
}
declare module "*.png" {
  const value: string;
  export = value;
}
declare module "shutterbug";
