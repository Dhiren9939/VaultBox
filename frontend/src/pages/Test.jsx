import { React, useState } from "react";
import axios from "axios";

function Test() {
  const [password, setPassword] = useState("DhirenIsSmartasYourBOI");
  const [firstName, setFirstName] = useState("Dhiren");
  const [lastName, setLastName] = useState("Mandaliya");
  const [email, setEmail] = useState("dhirenmandaliya1234567890@gmail.com");
  const [route, setRoute] = useState("");
  const [method, setMethod] = useState("post");
  const [response, setResponse] = useState("");
  const [request, setRequest] = useState("");

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
  };
  const handleLastNameChange = (e) => {
    setLastName(e.target.value);
  };
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handleRouteChange = (e) => {
    setRoute(e.target.value);
  };
  const handleMethodChange = (e) => {
    setMethod(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const request = {
      firstName,
      lastName,
      password,
      confirmPassword: password,
      email,
    };
    const response = await axios[`${method}`](
      `http://localhost:3000${route}`,
      request,
    );
    setRequest(request);
    setResponse(response);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>First Name:</label>
        <input type="text" value={firstName} onChange={handleFirstNameChange} />
      </div>
      <div>
        <label>Last Name:</label>
        <input type="text" value={lastName} onChange={handleLastNameChange} />
      </div>
      <div>
        <label>Password:</label>
        <input type="text" value={password} onChange={handlePasswordChange} />
      </div>
      <div>
        <label>Email:</label>
        <input type="text" value={email} onChange={handleEmailChange} />
      </div>
      <div>
        <label>Route:</label>
        <input type="text" value={route} onChange={handleRouteChange} />
      </div>
      <div>
        <label>Method:</label>
        <input type="text" value={method} onChange={handleMethodChange} />
      </div>
      <button type="submit">Submit</button>
      <br />
      <p>Request: {JSON.stringify(request)}</p>
      <br />
      <p>Response: {JSON.stringify(response)}</p>
    </form>
  );
}

export default Test;
