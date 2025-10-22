/**
 * MÓDULO DE IA - GEMINI INTEGRATION
 * Funciones para interactuar con la API de Gemini
 */

const AI = {
    apiKey: 'configured',
    baseUrl: '/api/gemini',
    
    // Inicializar
    async init() {
        this.apiKey = 'configured';
        console.log('✅ Módulo de IA inicializado (proxy seguro)');
        return true;
    },
    
    // Función genérica para llamar a Gemini a través del proxy
    async generateContent(prompt, systemInstruction = null) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    systemInstruction
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error en la API de Gemini');
            }
            
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0]) {
                throw new Error('Respuesta inválida de Gemini');
            }
            
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error al llamar a Gemini:', error);
            throw error;
        }
    },
    
    // Chat simple con contexto
    async chat(message, context = []) {
        const systemPrompt = `Eres un asistente inteligente de productividad personal. 
Ayudas al usuario con su plan de pasantía en IA, gestión de tareas, hábitos y organización.
Sé conciso, útil y motivador.`;
        
        let fullPrompt = message;
        if (context.length > 0) {
            fullPrompt = `Contexto de conversación anterior:\n${context.join('\n')}\n\nUsuario: ${message}`;
        }
        
        return await this.generateContent(fullPrompt, systemPrompt);
    },
    
    // Generar tareas inteligentes basadas en metas
    async generateTasks(goal, context = {}) {
        const prompt = `Genera 3-5 tareas específicas y accionables para lograr esta meta: "${goal}"
        
Contexto del usuario:
- Área: Pasantía en Inteligencia Artificial
- Tareas actuales: ${context.currentTasks || 0}
- Nivel: ${context.level || 'Intermedio'}

Devuelve SOLO un array JSON con este formato exacto:
[
  {
    "title": "Título corto de la tarea",
    "description": "Descripción detallada",
    "priority": "high|medium|low",
    "tags": ["tag1", "tag2"]
  }
]

Responde únicamente con el JSON, sin texto adicional.`;
        
        const response = await this.generateContent(prompt);
        try {
            // Extraer JSON de la respuesta
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No se pudo parsear la respuesta');
        } catch (error) {
            console.error('Error parseando tareas generadas:', error);
            return [];
        }
    },
    
    // Analizar productividad y dar insights
    async analyzeProductivity(data) {
        const prompt = `Analiza estos datos de productividad y proporciona 3 insights clave:

Datos:
- Tareas completadas esta semana: ${data.completedTasks}
- Tareas pendientes: ${data.pendingTasks}
- Sesiones Pomodoro: ${data.pomodoroSessions}
- Racha de hábitos: ${data.habitStreak} días
- Horas de estudio estimadas: ${data.studyHours}

Proporciona:
1. Un análisis breve del rendimiento
2. Una recomendación específica para mejorar
3. Un mensaje motivacional personalizado

Formato: Texto claro y conciso, máximo 150 palabras.`;
        
        return await this.generateContent(prompt);
    },
    
    // Mejorar/completar notas
    async enhanceNote(noteContent, action = 'improve') {
        let prompt = '';
        
        switch (action) {
            case 'improve':
                prompt = `Mejora esta nota manteniendo el contenido principal pero haciéndola más clara y estructurada:\n\n${noteContent}`;
                break;
            case 'summarize':
                prompt = `Crea un resumen conciso de esta nota (máximo 100 palabras):\n\n${noteContent}`;
                break;
            case 'expand':
                prompt = `Expande esta nota agregando detalles relevantes y ejemplos:\n\n${noteContent}`;
                break;
            case 'bullets':
                prompt = `Convierte esta nota en puntos clave (bullets):\n\n${noteContent}`;
                break;
        }
        
        return await this.generateContent(prompt);
    },
    
    // Sugerir hábitos basados en objetivos
    async suggestHabits(goals, currentHabits = []) {
        const prompt = `Sugiere 3 hábitos diarios para alguien que quiere: ${goals}

Hábitos actuales: ${currentHabits.join(', ') || 'Ninguno'}

Devuelve SOLO un array JSON:
[
  {
    "name": "Nombre del hábito",
    "description": "Por qué es importante",
    "icon": "code|book|exercise|meditation|water|study"
  }
]

Responde únicamente con el JSON, sin texto adicional.`;
        
        const response = await this.generateContent(prompt);
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No se pudo parsear la respuesta');
        } catch (error) {
            console.error('Error parseando hábitos sugeridos:', error);
            return [];
        }
    },
    
    // Crear plan de estudio personalizado
    async createStudyPlan(topic, duration, level) {
        const prompt = `Crea un plan de estudio estructurado para:
Tema: ${topic}
Duración: ${duration}
Nivel: ${level}

Proporciona un plan con fases, objetivos y recursos recomendados.
Máximo 300 palabras, bien estructurado con bullets o números.`;
        
        return await this.generateContent(prompt);
    },
    
    // Generar resumen diario/semanal
    async generateSummary(periodData) {
        const prompt = `Genera un resumen motivador de este período:

Logros:
- Tareas completadas: ${periodData.tasksCompleted}
- Hábitos cumplidos: ${periodData.habitsCompleted}
- Sesiones de enfoque: ${periodData.focusSessions}
- Notas creadas: ${periodData.notesCreated}

Proporciona:
1. Resumen de logros (50 palabras)
2. Estadística destacada
3. Mensaje motivacional para la próxima semana

Formato claro y positivo.`;
        
        return await this.generateContent(prompt);
    },
    
    // Responder preguntas sobre recursos de IA/ML
    async answerQuestion(question) {
        const systemPrompt = `Eres un experto en Inteligencia Artificial y Machine Learning.
Responde preguntas de forma clara, educativa y práctica.
Si la pregunta no es sobre IA/ML, indica que estás especializado en esos temas.`;
        
        return await this.generateContent(question, systemPrompt);
    }
};

// Exportar para uso global
window.AI = AI;
