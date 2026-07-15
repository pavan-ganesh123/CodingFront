import { GraphQLClient } from "graphql-request";

const endpoint = "https://codecache-13ic.onrender.com/graphql";

export const getClient = () => {
  const token = localStorage.getItem("token");

  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,  
    },
  });
};