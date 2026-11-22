import React from "react";
import { Button, Icon, Text } from "@gravity-ui/uikit";
import { ArrowLeft } from "@gravity-ui/icons";

export function WorkspacePage({ title, onBack, actions, children }) {
  return (
    <main className="workspacePage" aria-labelledby="workspace-page-title">
      <header className="workspacePageHeader">
        {onBack && (
          <Button view="outlined" size="xl" onClick={onBack}>
            <Button.Icon>
              <Icon data={ArrowLeft} size={20} />
            </Button.Icon>
            Назад
          </Button>
        )}
        <Text as="h1" variant="header-2" id="workspace-page-title">
          {title}
        </Text>
      </header>
      <div className="workspacePageBody">{children}</div>
      {actions && <footer className="workspacePageActions">{actions}</footer>}
    </main>
  );
}
