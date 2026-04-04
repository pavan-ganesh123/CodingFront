import React,{useEffect, useState} from "react";
import './Leetcode.css';

function Leetcode () {
    const [problems, setProblems] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/graphql",{
            method :"POST",
            headers :{
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `
                    query {
                        getAllProblems{
                            questionName
                            questionId
                            difficulty
                            link
                            intuition
                            code
                        }
                    }
                `,
            }),
        })
            .then((res)=> res.json())
            .then((data)=> setProblems(data.data.getAllProblems));
    }, []);
    return (
    <><h1 className="title" style={{ textAlign: "center", marginBottom: "20px" }}>
            LeetCode Problems
        </h1><div className="container">
                <div className="grid">
                    {problems.map((p, index) => (
                        <div key={index} className="leetcode_card">

                            {/* Title */}
                            <h2 className="title">{p.questionName}</h2>

                            {/* Meta */}
                            <div className="meta">
                                <span className="leetcode_platform">{p.questionId}. </span>
                                
                                    <a href={p.link} target="_blank" rel="noreferrer" className="button">
                                        View Problem
                                    </a>
                                
                                <span className={`difficulty ${p.difficulty.toLowerCase()}`}>
                                    {p.difficulty}
                                </span>
                            </div>

                            {/* Link */}
                            

                            {/* Intuition */}
                            <div className="intuition_block">
                                <div className="intuition_header">▶ Intuition</div>
                                <div className="intuition_content">
                                    {p.intuition?.split("\n").map((line, i) => {
                                        const text = line.trim();
                                        if (!text) return null;

                                        if (text.toLowerCase().includes("o(")) {
                                            return (
                                                <div key={i} className="tag complexity">
                                                    ⚡ {text}
                                                </div>
                                            );
                                        } else if (text.length < 50) {
                                            return (
                                                <div key={i} className="point">
                                                    {text}
                                                </div>
                                            );
                                        } else {
                                            return <p key={i}>{text}</p>;
                                        }
                                    })}
                                </div>
                            </div>

                            {/* Code */}
                            <div className="code_block">
                                <div className="code_header">💻 Code</div>
                                <pre className="line-numbers">
                                    <code className="language-cpp">
                                    {p.code?.replace(/</g, "<").replace(/>/g, ">")}
                                    </code>
                                </pre>
                            </div>

                        </div>
                    ))}
                </div>
            </div></>
  );
}

export default Leetcode;