import React, { useEffect, useState } from "react";
import { AsideHeader, MobileHeader } from "@gravity-ui/navigation";
import { User } from "@gravity-ui/uikit";
import { Code, Database, GraduationCap, House, ListCheck } from "@gravity-ui/icons";

const narrowScreen = window.matchMedia("(max-width: 880px)");
const pages = [
  { id: "Обзор", icon: House },
  { id: "Предметы", icon: GraduationCap },
  { id: "Практические работы", icon: ListCheck },
];

export function WorkspaceNavigation({ page, go, teacher, children }) {
  const [mobile, setMobile] = useState(narrowScreen.matches);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const update = () => setMobile(narrowScreen.matches);
    narrowScreen.addEventListener("change", update);
    return () => narrowScreen.removeEventListener("change", update);
  }, []);
  const links = teacher ? [...pages, {id: "Банк задач и тестов", icon: Database}] : pages;
  const items = links.map(({ id, icon }) => ({
    id,
    icon,
    title: id,
    current: id === page,
    onItemClick: () => go(id),
  }));
  const name = teacher ? "Ирина Волкова" : "Анна Смирнова";
  const avatar = { text: name };
  const user = (
    <User
      avatar={avatar}
      name={name}
      description={teacher ? "Преподаватель" : "Студент · ИВТ-24"}
    />
  );
  const logo = { text: "Контест", textSize: 20, icon: Code, onClick: () => go("Обзор") };
  if (mobile)
    return (
      <MobileHeader
        logo={logo}
        burgerOpenTitle="Открыть меню"
        burgerCloseTitle="Закрыть меню"
        burgerMenu={{ items, renderFooter: () => user }}
        renderContent={() => children}
      />
    );
  return (
    <AsideHeader
      logo={logo}
      menuItems={items}
      compact={compact}
      onChangeCompact={setCompact}
      expandTitle="Развернуть меню"
      collapseTitle="Свернуть меню"
      renderFooter={() => (
        <div className={compact ? "profile profileCompact" : "profile"}>
          {user}
        </div>
      )}
      renderContent={() => children}
    />
  );
}
