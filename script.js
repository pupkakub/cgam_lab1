 // шейдер - програма на glsl, виконується графічним процесором
 // вершинний шейдер. встановлення значення точки
const vsSource = ` 
    attribute vec4 aVertexPosition;  /*позиція вершини з буфера (x, y)*/
    attribute vec4 aVertexColor;  /*колір вершини (rgba)*/
    uniform mat4 uModelViewMatrix; /*матриця трансформації*/
    /*
        атрибути - різні дані для даних всередині групи
        уніформи - однакові для всієї групи
        vec4 - вектор з 4 компонентів float (xyzw або rgba). звертатись через pos.x або color.r
        mat4 - матриця 4на4
    */
    varying lowp vec4 vColor; /* змінна для передачі кольору з вершини до фрагментного шейдера
                            Low Precision - вказує відеокарті
                            мінімально можливу точність для збереження 
                            пам'яті та підвищення швидкості
                            varying - передача даних між шейдерами. оголошувати в обох шейдерах
                            замість varying in та out*/
    void main() {
        gl_Position = uModelViewMatrix * aVertexPosition; /*фінальна позиція вершини в системі координат webgl*/
        vColor = aVertexColor; /*передає колір на інтерполяцію (математичний метод знаходження 
                                проміжних значень величини на основі 
                                наявного дискретного набору відомих значень) до фрагм шейдера*/
    }
`; 

const fsSource = `
    varying lowp vec4 vColor; /*інтерпольований колір*/
    void main() {
        gl_FragColor = vColor; /*встановлення кольору конкретного пікселя*/
    }
`;

window.onload = function main() { // dom побудований, канвас існує
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl"); //отримати контекст малювання на елементі канвас;
    //містить функції малювання; керування відеокартою

    if (!gl) { alert("WebGL не підтримується :("); return; }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'), // повертає індекс атрибута у Vertex Shader
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), // повертає посилання на uniform
        },
    };

    // дані квадрата 
    const squareVertices = new Float32Array([
        -0.2,  0.2,   1.0, 0.0, 0.0, 1.0, // позиції xy та колір rgba
         0.2,  0.2,   0.0, 1.0, 0.0, 1.0, 
        -0.2, -0.2,   0.0, 0.0, 1.0, 1.0, 
         0.2,  0.2,   0.0, 1.0, 0.0, 1.0, 
         0.2, -0.2,   1.0, 1.0, 0.0, 1.0, 
        -0.2, -0.2,   0.0, 0.0, 1.0, 1.0  
    ]);
    const squareBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer); // array_buffer - буфер для вершинних даних (xy, rgba)
    // bind робить буфер активним, щоб gpu знав що vertexAttribPointer стосується цього буфера
    gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW); // заповнення масиву squareVertices
    // gl.STATIC_DRAW - підказка GPU, що дані будуть малюватися часто, але змінюватися рідко

    // фігура triangle_fan
    const fanVertices = new Float32Array([
         0.0,  0.0,   1.0, 1.0, 1.0, 1.0, // центр
         0.0,  0.15,  1.0, 0.0, 0.0, 1.0, 
         0.15, 0.05,  0.0, 1.0, 0.0, 1.0, 
         0.1, -0.15,  0.0, 0.0, 1.0, 1.0, 
        -0.1, -0.15,  1.0, 1.0, 0.0, 1.0, 
        -0.15, 0.05,  1.0, 0.0, 1.0, 1.0, 
         0.0,  0.15,  1.0, 0.0, 0.0, 1.0  
    ]);
    const fanBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fanBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fanVertices, gl.STATIC_DRAW);

    // статичний трикутник
    const triangleVertices = new Float32Array([
        0.0,  0.8,   1.0, 1.0, 0.0, 1.0, 
       -0.2,  0.5,   0.0, 1.0, 1.0, 1.0, 
        0.2,  0.5,   1.0, 0.0, 1.0, 1.0  
    ]);
    const triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

    let rotation = 0.0;
    let lastTime = 0;

    function render(now) { // функція викликається кожного кадру
        now *= 0.001; // час у мілісекундах в секунди
        const deltaTime = now - lastTime; // проміжок часу між кадрами
        lastTime = now; // час поточного кадру
        rotation += deltaTime; // обчислення нового кута обертання

        gl.clearColor(0.1, 0.2, 0.3, 1.0); // фон сцени
        gl.clear(gl.COLOR_BUFFER_BIT); // прапорець для очищення буфера кольору
        // programInfo.program - об'єкт WebGLProgram, який містить Vertex Shader + Fragment Shader
        gl.useProgram(programInfo.program); // всі вершини і фрагменти малювати через цю програму

        const aspect = canvas.height / canvas.width; // коефіцієнт, попереджає розтягування квадрата

        // матриця обертання
        gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
        setupAttributes(gl, programInfo);
        
        const c = Math.cos(rotation);
        const s = Math.sin(rotation);
        const rotateMat = new Float32Array([ // кут обертання, що змінюється
            c * aspect, s, 0, 0,
            -s * aspect, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, rotateMat); // передає матрицю у верх шейдер, де шейдер обчислює позицію вершини
        gl.drawArrays(gl.TRIANGLES, 0, 6); // малювати квадрат

        // рух п'ятикутника вгору вниз
        gl.bindBuffer(gl.ARRAY_BUFFER, fanBuffer);
        setupAttributes(gl, programInfo);

        const yOffset = Math.sin(now * 2) * 0.5;
        const moveMat = new Float32Array([
            aspect, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -0.6, yOffset, 0, 1 // зміщення ліворуч на -0.6 по x
        ]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, moveMat);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 7); // малювати всі 7 вершин (з центром і повторною останньою вершиною для замикання)
        
        // статичний трикутник
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
        setupAttributes(gl, programInfo);

        // одинична матриця Identity Matrix
        // не змінює координати тому трикутник стоятиме на місці
        const staticMat = new Float32Array([
            aspect, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1 
        ]);

        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, staticMat);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        requestAnimationFrame(render); // планування наступного кадру
    }
    requestAnimationFrame(render);
};

// допоміжна функція для налаштування атрибутів перед малюванням
function setupAttributes(gl, programInfo) {
    // пов'язує дані у буфер з атрибутом шейдера  
    // gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    // location - вказує на aVertexPosition у Vertex Shader
    // size - xy, type - тип даних у буфері, нормалізація - діапазон від 0 до 1, 
    // stride - крок між 2 вершинами в байтах; offset = 0 - читати з першого байта кожної вершини

    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition); // активує використання атрибуту у Vertex Shader
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource); // компілювати шейдери
    const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram(); // prog = контейнер для Vertex + Fragment Shader
    gl.attachShader(prog, vs); // прикріпити шейдери - GPU знає, що ця програма містить саме ці шейдери
    gl.attachShader(prog, fs);
    gl.linkProgram(prog); // перевірка сумісності шейдерів 
    return prog;
}

function loadShader(gl, type, source) {
    const s = gl.createShader(type); // створити шейдер в gpu
    gl.shaderSource(s, source); // присвоїти джерельний код GLSL
    gl.compileShader(s); // компілювати у внутрішнє gpu представлення 
    return s; // повернути скомпільований шейдер
}