const backend = `http://localhost:8080`;

export const environment = {
  production: false,
  backend: backend,
  backendDomain: "localhost:8080",
  queues: [
    `${backend}/queue`, // Guest queue
    `${backend}/user/queue`, // User queue
  ],
  public: `${backend}/public`,
  user: `${backend}/user`,
  problem: `${backend}/problem`,
  algorithm: `${backend}/algorithm`,
  rabbitMQ: {
    brokerURL: "ws://localhost:15674/ws",
    login: "root",
    passcode: "root",
  },
  problems: [
    "Belegundu",
    "DTLZ1_2",
    "DTLZ2_2",
    "DTLZ3_2",
    "DTLZ4_2",
    "DTLZ7_2",
    "ROT_DTLZ1_2",
    "ROT_DTLZ2_2",
    "ROT_DTLZ3_2",
    "ROT_DTLZ4_2",
    "ROT_DTLZ7_2",
    "UF1",
    "UF2",
    "UF3",
    "UF4",
    "UF5",
    "UF6",
    "UF7",
    "UF8",
    "UF9",
    "UF10",
    "UF11",
    "UF12",
    "UF13",
    "CF1",
    "CF2",
    "CF3",
    "CF4",
    "CF5",
    "CF6",
    "CF7",
    "CF8",
    "CF9",
    "CF10",
    "LZ1",
    "LZ2",
    "LZ3",
    "LZ4",
    "LZ5",
    "LZ6",
    "LZ7",
    "LZ8",
    "LZ9",
    "WFG1_2",
    "WFG2_2",
    "WFG3_2",
    "WFG4_2",
    "WFG5_2",
    "WFG6_2",
    "WFG7_2",
    "WFG8_2",
    "WFG9_2",
    "ZDT1",
    "ZDT2",
    "ZDT3",
    "ZDT4",
    "ZDT5",
    "ZDT6",
    "Binh",
    "Binh2",
    "Binh3",
    "Binh4",
    "Fonseca",
    "Fonseca2",
    "Jimenez",
    "Kita",
    "Kursawe",
    "Laumanns",
    "Lis",
    "Murata",
    "Obayashi",
    "OKA1",
    "OKA2",
    "Osyczka",
    "Osyczka2",
    "Poloni",
    "Quagliarella",
    "Rendon",
    "Rendon2",
    "Schaffer",
    "Schaffer2",
    "Srinivas",
    "Tamaki",
    "Tanaka",
    "Viennet",
    "Viennet2",
    "Viennet3",
    "Viennet4",
  ],
  algorithms: [
    "CMA-ES",
    "NSGAII",
    "NSGAIII",
    "GDE3",
    "eMOEA",
    "eNSGAII",
    "MOEAD",
    "MSOPS",
    "SPEA2",
    "PAES",
    "PESA2",
    "OMOPSO",
    "SMPSO",
    "IBEA",
    "SMS-EMOA",
    "VEGA",
    "DBEA",
    "RVEA",
    "RSO",
  ],
};

export enum UserType {
  Guest = 0,
  User = 1,
}
