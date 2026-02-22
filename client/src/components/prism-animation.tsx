import React from "react";

type PrismAnimationProps = {
  className?: string;
};

export default function PrismAnimation({ className = "" }: PrismAnimationProps) {
  return (
    <svg
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <style>{`
        .background-card {
          fill: #000;
        }

        .connector-line {
          fill: none;
          stroke: #333;
          stroke-width: 2;
          stroke-linecap: round;
        }

        .pulse-dot {
          fill: #fff;
          filter: blur(2px);
        }

        @keyframes hub-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        #center-hub {
          transform-origin: center;
          animation: hub-pulse 4s ease-in-out infinite;
        }

        .flow {
          stroke-dasharray: 4 200;
          stroke: #fff;
          stroke-width: 3;
          stroke-linecap: round;
          animation: flow-move 3s linear infinite;
        }

        @keyframes flow-move {
          from {
            stroke-dashoffset: 204;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <g id="connectors">
        <path className="connector-line" d="M250,250 Q300,350 400,400" />
        <path className="connector-line flow" d="M250,250 Q300,350 400,400" />

        <path className="connector-line" d="M400,250 Q410,320 400,400" />
        <path
          className="connector-line flow"
          d="M400,250 Q410,320 400,400"
          style={{ animationDelay: "0.5s" }}
        />

        <path className="connector-line" d="M550,250 Q500,350 400,400" />
        <path
          className="connector-line flow"
          d="M550,250 Q500,350 400,400"
          style={{ animationDelay: "1s" }}
        />

        <path className="connector-line" d="M250,550 Q300,450 400,400" />
        <path
          className="connector-line flow"
          d="M250,550 Q300,450 400,400"
          style={{ animationDelay: "0.2s" }}
        />

        <path className="connector-line" d="M400,550 Q390,480 400,400" />
        <path
          className="connector-line flow"
          d="M400,550 Q390,480 400,400"
          style={{ animationDelay: "0.7s" }}
        />

        <path className="connector-line" d="M550,550 Q500,450 400,400" />
        <path
          className="connector-line flow"
          d="M550,550 Q500,450 400,400"
          style={{ animationDelay: "1.2s" }}
        />
      </g>

      <g id="center-hub" transform="translate(330, 330)">
        <rect className="background-card" width="140" height="140" rx="40" />
        <g transform="translate(35, 35) scale(0.12)"></g>
      </g>

      <g transform="translate(180, 180)">
        <rect className="background-card" width="100" height="100" rx="40" />
        <g transform="translate(25, 20) scale(0.05)"></g>
      </g>
    </svg>
  );
}
