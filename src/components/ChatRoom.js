import React, { useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";

var stompClient = null;
const ChatRoom = () => {
  const [userData, setUserData] = useState({
    username: "",
    receiverName: "",
    connected: false,
    message: "",
  });
  const [publicChat, setPublicChat] = useState([]);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [tab, setTab] = useState("CHATROOM");

  const registerUser = () => {
    console.log("CONNECTINNNNNNNG", userData);
    connect();
  };

  const connect = () => {
    let Sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    const conn = userData;
    conn.connected = true;
    setUserData(conn);
    console.log("CONNECTED : ", userData);

    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessageReceived
    );
    userJoin();
  };

  const userJoin = () => {
    let chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    //stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
    //setUserData({ ...userData, message: "" });
    console.log("CONNECTED : ", userData);
  };

  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    console.log("PUBLIC PAYLOAD DATA", payloadData);
    console.log("IN PUBLIC CHAT", privateChats, publicChat);
    console.log("IN PUBLIC CHAT", [...privateChats.keys()], publicChat);
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          console.log("LINE 60");
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChat.push(payloadData);
        setPublicChat([...publicChat]);
        break;
    }

    console.log("IN PUBLIC CHAT TAKE 2", privateChats, publicChat);
    console.log("IN PUBLIC CHAT TAKE 2", [...privateChats.keys()], publicChat);
  };

  const onPrivateMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    console.log("PRIVATE PAYLOAD DATA", payloadData);
    console.log("IN PRIVATE CHAT", privateChats, publicChat);
    if (privateChats.get(payloadData.senderName)) {
      privateChats.get(payloadData.senderName).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.senderName, list);
      setPrivateChats(new Map(privateChats));
    }
  };

  const sendPublicMessage = () => {
    console.log("IN SEND PUBLIC CHAT", userData);
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };

      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateMessage = () => {
    console.log("IN SEND PRIVATE CHAT", userData, tab);
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        receiverName: tab,
        message: userData.message,
        status: "MESSAGE",
      };
      if (userData.username !== tab) {
        console.log("SETTING CHAT MSG FOR PRIVATE CHAT", chatMessage);
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                className={`member ${tab === "CHATROOM" && "active"}`}
                onClick={() => {
                  setTab("CHATROOM");
                }}
              >
                Chatroom
              </li>
              {[...privateChats.keys()].map((name, index) => {
                return (
                  <li
                    className={`member ${tab === name && "active"}`}
                    key={index}
                    onClick={() => setTab(name)}
                  >
                    {name}
                  </li>
                );
              })}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {publicChat.map((chat, index) => {
                  return (
                    <li className="message" key={index}>
                      {chat.senderName !== userData.username && (
                        <div className="avatar">{chat.senderName}</div>
                      )}
                      <div className="message-data">{chat.message}</div>
                      {chat.senderName === userData.username && (
                        <div className="avatar self">{chat.senderName}</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="enter public message"
                  value={userData.message}
                  onChange={(e) =>
                    setUserData({ ...userData, message: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPublicMessage}
                >
                  send
                </button>
              </div>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {privateChats.get(tab).map((chat, index) => {
                  return (
                    <li className="message" key={index}>
                      {chat.senderName !== userData.username && (
                        <div className="avatar">{chat.senderName}</div>
                      )}
                      <div className="message-data">{chat.message}</div>
                      {chat.senderName === userData.username && (
                        <div className="avatar self">{chat.senderName}</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="enter private message"
                  value={userData.message}
                  onChange={(e) =>
                    setUserData({ ...userData, message: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateMessage}
                >
                  send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter the user name"
            value={userData.username}
            onChange={(e) => {
              setUserData({ ...userData, username: e.target.value });
            }}
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
