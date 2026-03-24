# @repo/plugin-mdblist

## Contributing

The `openapi-schema.json` schema file is maintained requires specific changes to match the API responses.

### Making the rank field nullable

The `rank` field must be nullable. Before running the code generation, search for `"rank": {` in `openapi-schema.json` and add `"nullable": true` to each occurrence.
