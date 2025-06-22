import "./styles.css";
import { Canvas } from "@react-three/fiber";
import {
  Box,
  Cloud,
  Environment,
  Instance,
  Instances,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  Sphere,
  Stats,
  useTexture
} from "@react-three/drei";
import { Floor } from "./components/Floor";
import Lights from "./components/Lights";
import { Color, Euler, MathUtils, RepeatWrapping, Vector3 } from "three";
import Fog from "./lib/Fog";
import { Suspense } from "react";
import { folder, Leva, useControls } from "leva";

const arr = new Array(800).fill(0).map((_, i) => {
  const scale = [
    MathUtils.randFloat(0.1, 1), //
    MathUtils.randFloat(2, 10),
    MathUtils.randFloat(0.1, 0.5)
  ];
  const size = 100;
  const pos = new Vector3().random().multiplyScalar(size);
  pos.x -= size / 2;
  pos.y = scale[1] / 2;
  pos.z -= size / 2;

  const col = new Color("#a1bccf");
  col.multiplyScalar(Math.random() + 0.5);

  const rot = new Euler();
  rot.y = MathUtils.randFloat(-Math.PI, Math.PI);

  return (
    <Instance
      key={`building-${i}`}
      color={col}
      position={pos}
      scale={scale}
      rotation={rot}
    />
  );
});
function Thing() {
  return (
    <Instances castShadow receiveShadow limit={arr.length} count={arr.length}>
      <boxGeometry />
      <meshPhysicalMaterial color={new Color("#a1bccf")} roughness={0} />

      {arr}
    </Instances>
  );
}

export default function App() {
  const Opts = useControls({
    Fog: folder({
      Fog_enbled: {
        label: "Enable",
        value: true
      },
      Fog_color: {
        label: "Color",
        value: "#ffffff"
      },
      Fog_density: {
        label: "Density",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.3
      },
      Fog_speed: {
        label: "Speed",
        min: 0,
        max: 10,
        step: 0.1,
        value: 1.7
      },
      Fog_distortion: {
        label: "Distortion",
        min: 0,
        max: 2,
        step: 0.01,
        value: 1.3
      },
      Fog_scale: {
        label: "Scale",
        min: 0,
        max: 100,
        step: 1,
        value: [100, 2.5, 100]
      },
      Fog_position: {
        label: "Position",
        min: 0,
        max: 100,
        step: 1,
        value: [0, 0, 0]
      }
    }),
    AutoRotate: {
      value: true
    }
  });

  return (
    <>
      <Leva collapsed />
      <Canvas shadows>
        {Opts.Fog_enbled && (
          <Fog
            attach="fog"
            color={Opts.Fog_color}
            scale={Opts.Fog_scale}
            position={Opts.Fog_position}
            speed={Opts.Fog_speed}
            distortion={Opts.Fog_distortion}
            density={Opts.Fog_density}
          />
        )}

        <color attach="background" args={[Opts.Fog_color]} />

        <OrbitControls
          makeDefault
          autoRotate={Opts.AutoRotate}
          autoRotateSpeed={0.1}
        />
        <OrthographicCamera zoom={25} position={[-40, 20, 40]} makeDefault />

        <Lights />
        <Floor />
        <Thing />

        {/* <Stats /> */}
      </Canvas>
    </>
  );
}
