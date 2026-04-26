import { GraphQLClient } from "graphql-request";

const endpoint = "http://localhost:8080/graphql";

export const getClient = () => {
  const token = localStorage.getItem("token");

  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,  
    },
  });
};