// ─────────────────────────────────────────────────────────────────────────────
// Jenkinsfile  —  Rolling Update & Rollback Pipeline
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'sehaj07'
        IMAGE_NAME         = "${DOCKERHUB_USERNAME}/myapp"
        IMAGE_TAG          = "${BUILD_NUMBER}"            // e.g. 12, 13, 14…
        // Explicitly defining the path to your working config
        KUBECONFIG_PATH    = 'C:\\Users\\SehajPreet\\.kube\\config'
    }

    stages {

        // ── 1. Checkout ───────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "Checking out source code — build #${BUILD_NUMBER}"
                checkout scm
            }
        }

        // ── 2. Build Docker Image ─────────────────────────────────────────────
        stage('Build Image') {
            steps {
                script {
                    echo "Building image: ${IMAGE_NAME}:${IMAGE_TAG}"
                    bat """
                        docker build ^
                          --build-arg APP_VERSION=1.${IMAGE_TAG}.0 ^
                          -t ${IMAGE_NAME}:${IMAGE_TAG} ^
                          -t ${IMAGE_NAME}:latest ^
                          .
                    """
                }
            }
        }

        // ── 3. Push to Docker Hub ─────────────────────────────────────────────
        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat """
                        docker login -u %DOCKER_USER% -p %DOCKER_PASS%
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                    """
                }
            }
        }

        // ── 4. Deploy (Rolling Update) ────────────────────────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "Triggering rolling update → ${IMAGE_NAME}:${IMAGE_TAG}"

                    // Added --kubeconfig flag to bypass Jenkins service user isolation
                    bat """
                        kubectl --kubeconfig="${KUBECONFIG_PATH}" set image deployment/myapp-dev ^
                          myapp=${IMAGE_NAME}:${IMAGE_TAG} ^
                          --record
                    """

                    // Wait for the rollout to complete
                    bat "kubectl --kubeconfig=\"${KUBECONFIG_PATH}\" rollout status deployment/myapp-dev --timeout=120s"
                }
            }
        }

        // ── 5. Smoke Test ─────────────────────────────────────────────────────
        stage('Smoke Test') {
            steps {
                script {
                    echo "Running smoke test against http://localhost:30080/health"
                    sleep(time: 5, unit: 'SECONDS')
                    // Using -f to fail silently if the URL is unreachable
                    bat "curl -sf http://localhost:30080/health || exit 1"
                }
            }
        }
    }

    // ── Post-build actions ────────────────────────────────────────────────────
    post {

        success {
            echo """
            ✅ Deployment successful!
               Image : ${IMAGE_NAME}:${IMAGE_TAG}
               App   : http://localhost:30080
               Check revision history with:
                 kubectl --kubeconfig="${KUBECONFIG_PATH}" rollout history deployment/myapp-dev
            """
        }

        failure {
            echo "❌ Pipeline failed — triggering automatic rollback to previous version"
            // Added --kubeconfig here as well to ensure rollback works even if deploy failed
            bat "kubectl --kubeconfig=\"${KUBECONFIG_PATH}\" rollout undo deployment/myapp-dev"
            
            // Confirm rollback completed
            bat "kubectl --kubeconfig=\"${KUBECONFIG_PATH}\" rollout status deployment/myapp-dev --timeout=60s"
            echo """
            ⏪ Rolled back successfully.
               To see all revisions:
                 kubectl --kubeconfig="${KUBECONFIG_PATH}" rollout history deployment/myapp-dev
            """
        }

        always {
            // Clean up dangling local images
            bat "docker image prune -f"
        }
    }
}