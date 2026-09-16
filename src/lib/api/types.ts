export interface JsonApiResourceIdentifier {
  type: string
  id: string
}

export interface JsonApiRelationship {
  data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null
}

export interface JsonApiResource<TAttributes> {
  type: string
  id: string
  attributes: TAttributes
  relationships?: Record<string, JsonApiRelationship>
}

export interface JsonApiDocument<TAttributes> {
  data: JsonApiResource<TAttributes>
}

export interface JsonApiCollectionDocument<TAttributes> {
  data: Array<JsonApiResource<TAttributes>>
}
