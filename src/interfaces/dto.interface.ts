export interface requestInterface {
  pagination: {
    limit: number;
    page: number;
  };
  body: {
    userName?: string;
    sorting: string;
    sortingBy?: string;
    age?: number;
  };
}
