from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import json
import asyncio

class MCPClient:
    def __init__(self):
        self.session = None
        # Connect to Docker MCP service if running, else local
        # As FastAPI isn't guaranteed to have massive_mcp installed inside its container.
        # This gracefully skips startup crashes if it's not present.
        self.server_params = StdioServerParameters(
            command="python",
            args=["-m", "mcp_server_massive"],
            env=None
        )

    async def connect(self):
        try:
            self.stdio_context = stdio_client(self.server_params)
            self.read, self.write = await self.stdio_context.__aenter__()
            self.session = ClientSession(self.read, self.write)
            await self.session.__aenter__()
            await self.session.initialize()
            print("Connected to MCP server via stdio")
        except Exception as e:
            print(f"Failed to connect to local MCP (might be running in standalone container): {e}")
            self.session = None

    async def _call_tool(self, name: str, arguments: dict):
        if not self.session:
            # Fallback mock for UI display
            await asyncio.sleep(1)
            return {"result": {
                "summary": f"Agent analysis for: {arguments.get('query', 'ticker')}",
                "metrics": [
                    { "label": "Data Source", "value": "Mocked (MCP Disconnected)" },
                    { "label": "Status", "value": "Fallback Active" }
                ],
                "dataPoints": ["MCP Server not fully integrated.", "Please review MCP connection protocol."]
            }}

        try:
            result = await self.session.call_tool(name, arguments=arguments)
            if hasattr(result, 'content') and len(result.content) > 0:
                if result.content[0].type == 'text':
                    try:
                        return json.loads(result.content[0].text)
                    except json.JSONDecodeError:
                        return {"result": {"summary": result.content[0].text}}
            return {"result": {"summary": "No content"}}
        except Exception as e:
            print(f"MCP tool error ({name}): {e}")
            return {"error": str(e)}

    async def search_endpoints(self, query: str):
        return await self._call_tool("search_endpoints", {"query": query})

    async def get_endpoint_docs(self, endpoint_id: str):
        return await self._call_tool("get_endpoint_docs", {"endpoint_id": endpoint_id})

    async def call_api(self, endpoint_id: str, parameters: dict):
        return await self._call_tool("call_api", {"endpoint_id": endpoint_id, "parameters": parameters})

    async def query_data(self, query: str):
        return await self._call_tool("query_data", {"query": query})

mcp_client = MCPClient()
