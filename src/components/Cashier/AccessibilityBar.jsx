import {useState, useEffect} from 'react';
import './AccessibilityBar.css'

export default function AccessibilityBar(){
	//default to the nromal 100%
	const [textSizePercent, setTextSizePercent] = useState(100);

	const [isHighConstrastOn, setIsHighContrastOn] = useState(false);

	useEffect(() => {
		document.documentElement.style.fontSize = textSizePercent + '%';
	}, [textSizePercent]);

	//This runs whenever the high contrast turned on or turned off
	useEffect(() => {
			document.documentElement.classList.toggle('high-contrast',isHighConstrastOn);
	}, [isHighConstrastOn]);


function makeTextBigger(){	
	if(textSizePercent < 200){
		setTextSizePercent(textSizePercent + 25);
	}
}

function makeTextSmaller(){
	if(textSizePercent > 10) {
		setTextSizePercent(textSizePercent - 25);
	}
}

function toggleHighContrast(){
	//flips the contrast when on becomes off and off becomes on
	setIsHighContrastOn(!isHighConstrastOn);
}

return(
	<div className="Accessibility-bar">
		<button onClick={makeTextSmaller} aria-label = "smaller text">A-</button>
		<button onClick={makeTextBigger} aria-label = "Larger text">A+</button>
		<button onClick={toggleHighContrast} aria-pressed = {isHighConstrastOn}>High Contrast</button>
	</div>
);
}
