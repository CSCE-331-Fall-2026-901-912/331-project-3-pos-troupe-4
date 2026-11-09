import {useState, useEffect} from 'react';
import './AccessibilityBar.css';

export default function AccessibilityBar(){
	//default to the nromal 100%
	const [textSizePercent, setTextSizePercent] = useState(100);

	const [isHighConstrastOn, setIsHighContrastOn] = useState(false);

	//This runs whenever the high contrast turned on or turned off
	useEffect(() => {
		if(isHighConstrastOn){
			document.documentElement.classList.add('high-constrast');
		}
		else{
			document.documentElement.classList.remove('high-constrast');
		}
	}, [isHighConstrastOn]);


function makeTextBigger(){
	if(testSizePerce < 200){
		setTextSizePercent(textSizePercent + 25);
	}
}

function toggleHighContrast(){
	//flips the contrast when on becomes off and off becomes on
	setIsHighContrastOn(!isHighConstrastOn);
}
return(
	<div className = "accessibility-Bar">
		<button onClick={makeTextSmaller} aria-label = "Smaller Text">A-</button>
		<button onClick={makeTextBigger} aria-label = "Larger Text">A+</button>

		<button onClick={toggleHighContrast} aria-pressed = {isHighConstrastOn}>High Contrast</button>
	</div>
	);
}
