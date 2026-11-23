import React, {useState} from "react";
import {FormRow} from "@gravity-ui/components";
import {Button, Card, Text, TextInput} from "@gravity-ui/uikit";

export function LoginPage({onLogin}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (username !== "mirea" || password !== "mirea") {
      setError(true);
      return;
    }
    onLogin();
  }

  return <main className="loginPage">
    <Card className="loginCard" view="raised">
      <Text variant="subheader-2" color="secondary">Контест</Text>
      <form onSubmit={submit} onChange={() => setError(false)}>
        <FormRow direction="column" label="Логин" fieldId="login-name">
          <TextInput id="login-name" name="username" value={username} onUpdate={setUsername}
            autoComplete="username" controlProps={{required:true}} size="l"/>
        </FormRow>
        <FormRow direction="column" label="Пароль" fieldId="login-password">
          <TextInput id="login-password" name="password" type="password" value={password}
            onUpdate={setPassword} autoComplete="current-password" controlProps={{required:true}} size="l"/>
        </FormRow>
        {error && <div role="alert"><Text color="danger">Неверный логин или пароль.</Text></div>}
        <Button type="submit" view="action" size="l">Войти</Button>
      </form>
    </Card>
  </main>;
}
