import React, { useId, useState } from "react";
import { Button, Icon, Palette, Popup } from "@gravity-ui/uikit";
import {
  BookOpen,
  ChevronDown,
  Globe,
  Terminal,
  ChartColumn,
  Molecule,
  Cpu,
  CurlyBrackets,
  Database,
  MathOperations,
  NodesDown,
} from "@gravity-ui/icons";

const colors = {
  blue: "Синий",
  green: "Зелёный",
  purple: "Фиолетовый",
  orange: "Оранжевый",
  gray: "Серый",
  red: "Красный",
  yellow: "Жёлтый",
  teal: "Бирюзовый",
  pink: "Розовый",
  indigo: "Индиго",
};
const icons = {
  code: [CurlyBrackets, "Код"],
  tree: [NodesDown, "Алгоритмы"],
  wave: [MathOperations, "Математика"],
  database: [Database, "База данных"],
  cpu: [Cpu, "Процессор"],
  book: [BookOpen, "Книга"],
  globe: [Globe, "Глобус"],
  terminal: [Terminal, "Терминал"],
  chart: [ChartColumn, "Диаграмма"],
  molecule: [Molecule, "Молекула"],
};

export function coverSettings(subject) {
  const legacyColor =
    { tree: "green", wave: "purple" }[subject?.motif] ?? "blue";
  return {
    color: Object.hasOwn(colors, subject?.color) ? subject.color : legacyColor,
    icon: Object.hasOwn(icons, subject?.icon)
      ? subject.icon
      : Object.hasOwn(icons, subject?.motif)
        ? subject.motif
        : "code",
  };
}

export function SubjectCover({ color, icon }) {
  return (
    <div className={"cover cover-" + color} aria-hidden="true">
      <Icon data={icons[icon][0]} size={66} />
    </div>
  );
}

const colorOptions = Object.entries(colors).map(([value, title]) => ({
  value,
  title,
  content: <span className={"coverSwatch cover-" + value} />,
}));
const iconOptions = Object.entries(icons).map(([value, [data, title]]) => ({
  value,
  title,
  content: <Icon data={data} size={20} />,
}));

function PalettePicker({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <Button
        ref={setAnchor}
        size="l"
        width="max"
        view="outlined"
        aria-label={label + ": " + selected.title}
        extraProps={{
          "aria-expanded": open,
          "aria-haspopup": "grid",
          "aria-controls": open ? id : undefined,
        }}
        onClick={() => setOpen(!open)}
      >
        <Button.Icon>{selected.content}</Button.Icon>
        {label}
        <Icon data={ChevronDown} />
      </Button>
      <Popup
        id={id}
        aria-label={label}
        anchorElement={anchor}
        open={open}
        placement="bottom-start"
        initialFocus={0}
        returnFocus
        onOpenChange={setOpen}
      >
        <Palette
          className="coverPalette"
          aria-label={label}
          multiple={false}
          columns={5}
          size="l"
          value={[value]}
          options={options}
          onUpdate={([next]) => {
            if (next) onChange(next);
            setOpen(false);
          }}
        />
      </Popup>
    </>
  );
}

export function CoverPicker({ color, icon, onChange }) {
  return (
    <fieldset className="coverPicker">
      <legend>Обложка предмета</legend>
      <div className="coverControls">
        <PalettePicker
          label="Цвет"
          value={color}
          options={colorOptions}
          onChange={(value) => onChange("color", value)}
        />
        <PalettePicker
          label="Иконка"
          value={icon}
          options={iconOptions}
          onChange={(value) => onChange("icon", value)}
        />
      </div>
      <SubjectCover color={color} icon={icon} />
    </fieldset>
  );
}
