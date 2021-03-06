// This file is loaded by Jest without any preprocessing. Use regular JS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const enzyme = require("enzyme");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Adapter = require("enzyme-adapter-react-16");

enzyme.configure({ adapter: new Adapter() });

// Mock flooding-engine-gpu by default.
jest.mock("./models/engine/flooding-engine-gpu");