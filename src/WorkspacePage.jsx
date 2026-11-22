import React from "react";
import { Button, Icon, Text } from "@gravity-ui/uikit";
import { AppearanceSettings } from "./Appearance";
import { ArrowLeft } from "@gravity-ui/icons";

export function WorkspacePage({ title, onReturnToWorks, actions, children }) {
  return (
    <main className="workspacePage" aria-labelledby="workspace-page-title">
      <header className="workspacePageHeader">
        {onReturnToWorks && (
          <Button view="flat" size="l" onClick={onReturnToWorks}>
            <Button.Icon><Icon data={ArrowLeft}/></Button.Icon>
            К работам
          </Button>
        )}
        <Text as="h1" variant="header-2" id="workspace-page-title">
          {title}
        </Text>
        <AppearanceSettings/>
      </header>
      <div className="workspacePageBody">{children}</div>
      {actions && <footer className="workspacePageActions">{actions}</footer>}
    </main>
  );
}
