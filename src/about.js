import React from "react";
export const about = () => {
    return (
      <div className="flex justify-center mt-10">
       
        <div class="mx-auto max-w-screen-xl text-center mb-8 lg:mb-12 pt-10">
                <h2 class="mb-4 text-6xl tracking-tight font-extrabold text-blue-600">Human Action Recognition</h2>
                <p class=" font-light text-black sm:text-xl ">This device's goal is to assist visually impaired individuals on their social activities by detecting actions the people make around them and identifying who these people are. The models used for the system are made through Teachable System. These models are powered by tensorflow.js allowing them to run on javascript without the need of dedicated hardware. Start using the device by clicking on the "Home" button. </p>
        </div>


      </div>
    );
  };
  export default about;
