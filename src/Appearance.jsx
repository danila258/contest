import React, {createContext, useContext, useId, useState} from "react";
import {Button, Icon, Popup, RadioGroup, Text, ThemeProvider, useTheme, useThemeType} from "@gravity-ui/uikit";
import {Moon, Sun} from "@gravity-ui/icons";

const ChangeTheme = createContext(null);
const storageKey = "practice.theme";

export function AppearanceProvider({children}) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Storage may be disabled by the browser.
    }
    return "system";
  });
  function changeTheme(next) {
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The selected theme still applies for this session.
    }
  }
  return <ThemeProvider theme={theme} lang="ru">
    <ChangeTheme.Provider value={changeTheme}>{children}</ChangeTheme.Provider>
  </ThemeProvider>;
}

const themeOptions = [
  {value: "system", content: "Системная"},
  {value: "light", content: "Светлая"},
  {value: "dark", content: "Тёмная"},
];

export function AppearanceSettings() {
  const theme = useTheme();
  const themeType = useThemeType();
  const changeTheme = useContext(ChangeTheme);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  return <>
    <Button ref={setAnchor} className="appearanceButton" view="flat" aria-label="Настройки оформления"
      title="Настройки оформления" onClick={() => setOpen(!open)}
      extraProps={{"aria-expanded": open, "aria-controls": open ? id : undefined, "aria-haspopup": "dialog"}}>
      <Button.Icon><Icon data={themeType === "dark" ? Sun : Moon}/></Button.Icon>
    </Button>
    <Popup id={id} aria-label="Настройки оформления" anchorElement={anchor} open={open}
      placement="bottom-end" initialFocus={0} returnFocus onOpenChange={setOpen}>
      <div className="appearancePanel">
        <Text variant="subheader-1" id={id + "-theme"}>Тема оформления</Text>
        <RadioGroup aria-labelledby={id + "-theme"} direction="vertical" size="l"
          value={theme} options={themeOptions} onUpdate={changeTheme}/>
      </div>
    </Popup>
  </>;
}
