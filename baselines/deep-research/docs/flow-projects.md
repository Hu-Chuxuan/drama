# Flow Project Management

The Open Deep Research platform now includes a project management system that allows users to persist their research flows and organize them into separate projects.

## Features

1. **Project Persistence** - All research flows are automatically saved to the browser's localStorage, ensuring that research progress is not lost if the browser is closed.

2. **Multiple Projects** - Users can create and switch between multiple research projects, each with its own set of nodes, edges, and research queries.

3. **Project Management** - Create, rename, and delete projects as needed.

4. **Import/Export** - Export projects to JSON files for backup and import them back when needed.

5. **Storage Monitoring** - View localStorage usage to manage your saved projects effectively.

## How It Works

- **Automatic Saving**: The flow state (nodes, edges, query) is automatically saved to localStorage as you work.
- **Project Selector**: Use the dropdown menu in the top navigation bar to:
  - Switch between existing projects
  - Create new projects
  - Rename or delete projects
- **Data Management**: Use the database icon button to:
  - Export projects as JSON files
  - Import previously exported projects
  - View storage usage information

## Technical Implementation

The project management system is built on:

1. `useFlowProjects` Hook:

   - Manages project state using localStorage
   - Provides functions for creating, updating, and deleting projects
   - Handles automatic saving of project state
   - Monitors localStorage usage

2. `ProjectSelector` Component:

   - Provides a user interface for project management
   - Displays a list of available projects with timestamps
   - Includes dialogs for creating and deleting projects

3. `ProjectActions` Component:

   - Handles import and export functionality
   - Shows storage usage information
   - Provides warnings when storage is running low

4. localStorage Keys:
   - `open-deep-research-flow-projects`: Stores the array of all projects
   - `open-deep-research-current-project`: Stores the ID of the currently active project

## Data Structure

Each project contains:

```typescript
interface FlowProject {
  id: string // Unique identifier
  name: string // User-defined project name
  createdAt: string // Creation timestamp
  updatedAt: string // Last update timestamp
  nodes: Node[] // ReactFlow nodes
  edges: Edge[] // ReactFlow edges
  query: string // Research query
}
```

## Limitations

- Project data is stored in the browser's localStorage, which has a size limit (typically 5MB)
- Projects are not synced across devices or browsers
- If localStorage is cleared, all projects will be lost (use export for backup)

## Best Practices

1. **Regular Exports**: Export your projects regularly to avoid data loss
2. **Monitor Storage**: Keep an eye on your storage usage to avoid hitting limits
3. **Project Organization**: Create separate projects for different research topics
4. **Clean Up**: Delete unnecessary projects to free up storage space

## Future Improvements

- Cloud synchronization for projects across devices
- More advanced project organization (folders, tags, etc.)
- Version history and rollback capabilities
- Selective import of specific projects
