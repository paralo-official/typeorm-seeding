import { DataSource, DataSourceOptions } from 'typeorm'

export function isDataSource(obj: unknown): obj is DataSource {
  return typeof obj === 'object' && !!obj?.hasOwnProperty('isInitialized')
}

export const resolveDataSource = (dataSource: DataSource | DataSourceOptions): DataSource => {
  // create new instance if necessary
  const dataSourceToReturn = isDataSource(dataSource) ? dataSource : new DataSource(dataSource)
  // return the data source
  return dataSourceToReturn
}
