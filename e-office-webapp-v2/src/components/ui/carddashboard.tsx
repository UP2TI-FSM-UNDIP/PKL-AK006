import React from "react";

interface CardDashboardProps {
	title: string;
	value: string | number;
	desc: string;
	icon?: React.ReactNode;
	onClick?: () => void;
	isActive?: boolean;
	color?: "blue" | "green" | "orange" | "red" | "purple";
	highlight?: boolean;
}



export function CardDashboard({
	title,
	value,
	desc,
	icon,
	onClick,
	isActive = false,
	color = "blue",
	highlight = false
}: CardDashboardProps) {

	const colorStyles = {
		blue: {
			iconBg: "bg-blue-100 dark:bg-blue-900/30",
			iconText: "text-blue-600 dark:text-blue-400",
			activeBg: "bg-blue-50/50 dark:bg-blue-900/10",
			activeRing: "ring-blue-500",
			dot: "bg-blue-500",
			highlightBorder: "border-l-blue-500",
			highlightPulse: "bg-blue-500",
		},
		green: {
			iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
			iconText: "text-emerald-600 dark:text-emerald-400",
			activeBg: "bg-emerald-50/50 dark:bg-emerald-900/10",
			activeRing: "ring-emerald-500",
			dot: "bg-emerald-500",
			highlightBorder: "border-l-emerald-500",
			highlightPulse: "bg-emerald-500",
		},
		orange: {
			iconBg: "bg-orange-100 dark:bg-orange-900/30",
			iconText: "text-orange-600 dark:text-orange-400",
			activeBg: "bg-orange-50/50 dark:bg-orange-900/10",
			activeRing: "ring-orange-500",
			dot: "bg-orange-500",
			highlightBorder: "border-l-orange-500",
			highlightPulse: "bg-orange-500",
		},
		red: {
			iconBg: "bg-red-100 dark:bg-red-900/30",
			iconText: "text-red-600 dark:text-red-400",
			activeBg: "bg-red-50/50 dark:bg-red-900/10",
			activeRing: "ring-red-500",
			dot: "bg-red-500",
			highlightBorder: "border-l-red-500",
			highlightPulse: "bg-red-500",
		},
		purple: {
			iconBg: "bg-purple-100 dark:bg-purple-900/30",
			iconText: "text-purple-600 dark:text-purple-400",
			activeBg: "bg-purple-50/50 dark:bg-purple-900/10",
			activeRing: "ring-purple-500",
			dot: "bg-purple-500",
			highlightBorder: "border-l-purple-500",
			highlightPulse: "bg-purple-500",
		},
	};

	const theme = colorStyles[color] || colorStyles.blue;
	const showHighlight = highlight && (typeof value === 'number' ? value > 0 : !!value);

	return (
		<div
			onClick={onClick}
			className={`
				relative overflow-hidden rounded-2xl p-5 cursor-pointer
				bg-white dark:bg-gray-800
				border border-gray-100 dark:border-gray-700
				transition-all duration-300 group
				hover:-translate-y-1 hover:shadow-md
				${showHighlight ? `border-l-4 ${theme.highlightBorder}` : ''}
				${isActive
					? `${theme.activeBg} shadow-md`
					: 'shadow-sm'
				}
			`}
			style={{
				flex: '1 1 260px',
			} as React.CSSProperties}
		>
			{/* Pulsing indicator for highlight */}
			{showHighlight && (
				<div className="absolute top-3 right-3 flex items-center justify-center">
					<span className={`absolute w-3 h-3 rounded-full ${theme.highlightPulse} opacity-40 animate-ping`} />
					<span className={`relative w-2.5 h-2.5 rounded-full ${theme.highlightPulse}`} />
				</div>
			)}

			<div className="flex justify-between items-start mb-4">
				<div>
					<p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
						{title}
					</p>
					<h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
						{typeof value === 'number' ? value.toLocaleString('id-ID') : value}
					</h3>
				</div>

				{/* Icon Container */}
				{icon && (
					<div className={`
						p-3 rounded-xl transition-all duration-300
						${theme.iconBg} ${theme.iconText}
						group-hover:scale-105
					`}>
						<div className="w-6 h-6 flex items-center justify-center text-xl">
							{icon}
						</div>
					</div>
				)}
			</div>

			<div className="flex items-center">
				<p className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
					<span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
					{desc}
				</p>
			</div>
		</div>
	);
}


