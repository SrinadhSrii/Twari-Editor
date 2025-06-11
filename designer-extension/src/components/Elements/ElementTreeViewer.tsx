import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ElementMapping } from "../../types/element-mapping";

interface ElementTreeViewerProps {
  tree: ElementMapping;
  depth?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface FormattedElement {
  name: string;
  id: string;
  type: string;
  styles: string[];
  customAttributes: Record<string, unknown>;
  children: FormattedElement[];
}

const formatElementData = (element: ElementMapping): FormattedElement => {
  const styleName = element.styles?.[0]?.name;
  const displayName = styleName || `${element.type} (No Style)`;

  return {
    name: displayName,
    id: element.id,
    type: element.type,
    styles: element.styles?.map((style) => style.name) || [],
    customAttributes: element.attributes || {},
    children:
      element.children
        ?.filter(Boolean)
        .map((child) => formatElementData(child)) || [],
  };
};

export function ElementTreeViewer({ tree, depth = 0 }: ElementTreeViewerProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  console.log(tree);
  return (
    <Box>
      <Tabs
        value={selectedTab}
        onChange={(_, newValue) => setSelectedTab(newValue)}
      >
        <Tab label="Element Tree" />
        <Tab label="Raw Styles" />
      </Tabs>

      <TabPanel value={selectedTab} index={0}>
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: "4px" }}
        >
          {JSON.stringify(formatElementData(tree), null, 2)}
        </SyntaxHighlighter>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: "4px" }}
        >
          {JSON.stringify(tree.styles, null, 2)}
        </SyntaxHighlighter>
      </TabPanel>
    </Box>
  );
}
