import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import { Vector3 } from "three";

const Index = () => {
	const [renderer, setRenderer] = useState(null);
	const [activeCamera, setActiveCamera] = useState(null);
	const [firstIteration, setFirstIteration] = useState(true);
	const [scene, setScene] = useState(null);
	const [controls, setControls] = useState(null);
	const [model, setModel] = useState(null);
	const [gui, setGui] = useState(null);
	const [background, setBackground] = useState(null);
	const [cameraArray, setCameraArray] = useState([]);
	const [backgroundFileName, setBackgroundFileName] = useState(null);
	const [backgroundFile, setBackgroundFile] = useState(null);
	const [models, setModels] = useState({
		azura: "/azura",
		concerto: "/concerto",
		phoenix: "/phoenix",
		shiba: "/shiba",
		wolf: "/wolf",
	});
	const [activeModel, setActiveModel] = useState({
		name: "shiba",
		animation: 0,
	});
	let mixer;
	let animationUI;

	const clock = new THREE.Clock();

	useEffect(() => {
		if (firstIteration) {
			setFirstIteration(false);
			//set general scene
			const scene = new THREE.Scene();
			const freeCamera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);
			const renderer = new THREE.WebGLRenderer();
			const controls = new OrbitControls(freeCamera, renderer.domElement);
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);
			freeCamera.position.z = 5;
			controls.update();

			//Set lights
			const light = new THREE.PointLight(0xffffff, 10, 100000, 0);
			light.position.set(1, 1, 1);
			scene.add(light);
			const light2 = new THREE.PointLight(0xffffff, 10, 100000, 0);
			light2.position.set(-1, 1, -1);
			scene.add(light2);

			//SetCameraBackground
			const texture = new THREE.TextureLoader().load("/fondo.png");
			scene.background = texture;

			//Set model loader
			const loader = new GLTFLoader();

			loader.load(
				`${models[activeModel.name]}/scene.gltf`,
				function (gltf) {
					gltf.scene.name = "model";
					scene.add(gltf.scene);
					if (gltf.animations.length) {
						mixer = new THREE.AnimationMixer(gltf.scene);
						mixer.clipAction(gltf.animations[0]).play();
					}
				},
				undefined,
				(error) => {
					console.log(error);
				}
			);

			//Set different cameras
			const rightCamera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);
			rightCamera.position.z = 5;
			rightCamera.lookAt(0, 0, 0);

			const frontCamera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);
			frontCamera.position.x = -5;
			frontCamera.lookAt(0, 0, 0);

			const backCamera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);
			backCamera.position.x = 5;
			backCamera.lookAt(0, 0, 0);

			const leftCamera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);
			leftCamera.position.z = -5;
			leftCamera.lookAt(0, 0, 0);

			const cameraArray = {
				Free: freeCamera,
				Right: rightCamera,
				Front: frontCamera,
				Back: backCamera,
				Left: leftCamera,
			};
			const activeCamera = freeCamera;

			//Set GUI
			const gui = new GUI();

			//Light GUI
			const lightFolder = gui.addFolder("Light");
			lightFolder.add(light, "intensity", 0.1, 10, 0.1).onChange((e) => {
				light2.intensity = e;
			});
			lightFolder
				.addColor(light, "color")
				.listen()
				.onChange((e) => {
					light.color.setStyle(e);
					light2.color.setStyle(e);
				});
			lightFolder
				.add(light.position, "x", -100, 100)
				.onChange((e) => (light2.position.x = -e));
			lightFolder
				.add(light.position, "y", 0, 100)
				.onChange((e) => (light2.position.y = e));
			lightFolder
				.add(light.position, "z", -100, 100)
				.onChange((e) => (light2.position.z = -e));
			lightFolder.open();

			//Camera GUI
			const cameraFolder = gui.addFolder("Camera");
			cameraFolder
				.add(activeCamera, "name", [
					"Free",
					"Right",
					"Front",
					"Back",
					"Left",
				])
				.setValue("Free")
				.onChange((e) => {
					setActiveCamera(cameraArray[e]);
					cameraArray[e].aspect =
						window.innerWidth / window.innerHeight;
					cameraArray[e].updateProjectionMatrix();
					requestAnimationFrame(animate);
					animate();
				});
			cameraFolder.open();

			//Models GUI
			const modelFolder = gui.addFolder("Model");
			modelFolder
				.add(activeModel, "name", models)
				.setValue("/shiba")
				.onChange((e) => {
					let activeModel = { name: e.split("/")[1], animation: 0 };
					changeModel(activeModel, modelFolder, scene);
					setActiveModel(activeModel);
				});

			setCameraArray(cameraArray);
			setActiveCamera(activeCamera);
			setRenderer(renderer);
			setControls(controls);
			setScene(scene);
			setGui(gui);
			setBackground(texture);

			const animate = function () {
				requestAnimationFrame(animate);
				var delta = clock.getDelta();

				if (mixer) mixer.update(delta);
				renderer.render(scene, cameraArray[activeCamera.name]);
			};

			animate();
		}
	}, []);

	const changeModel = (valueModel, gui, scene) => {
		const loader = new GLTFLoader();
		const model = scene.getObjectByName("model");
		scene.remove(model);
		if (animationUI) gui.remove(animationUI);
		loader.load(
			`${models[valueModel.name]}/scene.gltf`,
			function (gltf) {
				gltf.scene.name = "model";
				scene.add(gltf.scene);
				setModel(gltf.scene);
				if (gltf.animations.length) {
					if (mixer) {
						mixer._actions[0].stop();
						mixer.uncacheClip(mixer._actions[0]);
					}
					mixer = new THREE.AnimationMixer(gltf.scene);
					mixer.clipAction(gltf.animations[0]).play();
					let animations = {};
					gltf.animations.forEach((elem, index) => {
						animations[index] = index;
					});
					animationUI = gui
						.add(activeModel, "animation", animations)
						.onChange((e) => {
							mixer._actions[0].stop();
							mixer.uncacheClip(mixer._actions[0]);
							mixer.clipAction(gltf.animations[e]).play();
							setActiveModel({
								name: valueModel.name,
								animation: e,
							});
						});
				} else setActiveModel({ name: valueModel.name, animation: 0 });
			},
			undefined,
			(error) => {
				console.log(error);
			}
		);
	};

	const handleResize = (event) => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		renderer.setSize(width, height);
		activeCamera.aspect = width / height;
		activeCamera.updateProjectionMatrix();
		controls.update();
	};

	const handleFile = (event) => {
		setBackgroundFile(event.target.files[0]);
		setBackgroundFileName(event.target.files[0].name);
		const texture = new THREE.TextureLoader().load(
			URL.createObjectURL(event.target.files[0])
		);
		scene.background = texture;
		setBackground(texture);
	};

	const handleFileClick = (event) => {
		document.getElementById("inputFile").click();
	};

	if (renderer) window.addEventListener("resize", handleResize);

	return (
		<div>
			<div className="backgroundFile" onClick={handleFileClick}>
				<input
					onChange={handleFile}
					id="inputFile"
					className="fileInput"
					type="file"
				/>
				<p className="fileName">
					{backgroundFileName
						? backgroundFileName
						: "Background File"}
				</p>
			</div>
		</div>
	);
};

export default Index;
