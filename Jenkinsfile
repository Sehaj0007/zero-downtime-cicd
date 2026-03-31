// ─────────────────────────────────────────────────────────────────────────────
// Jenkinsfile  —  Rolling Update & Rollback Pipeline
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'sehaj07'
        IMAGE_NAME         = "${DOCKERHUB_USERNAME}/myapp"
        IMAGE_TAG          = "${BUILD_NUMBER}"            // e.g. 12, 13, 14…
        KUBECONFIG         = 'C:\\Users\\SehajPreet\\.kube\\config'
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

                    // Update the image — Kubernetes performs the rolling update automatically
                    bat """
                        kubectl set image deployment/myapp ^
                          myapp=${IMAGE_NAME}:${IMAGE_TAG} ^
                          --record
                    """

                    // Wait for the rollout to complete (timeout: 2 minutes)
                    // If it times out, the pipeline fails and you can rollback manually.
                    bat "kubectl rollout status deployment/myapp --timeout=120s"
                }
            }
        }

        // ── 5. Smoke Test ─────────────────────────────────────────────────────
        stage('Smoke Test') {
            steps {
                script {
                    echo "Running smoke test against http://localhost:30080/health"
                    // Give the service a moment after rollout
                    sleep(time: 5, unit: 'SECONDS')
                    bat """
                        curl -sf http://localhost:30080/health || exit 1
                    """
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
                 kubectl rollout history deployment/myapp
            """
        }

        failure {
            echo "❌ Pipeline failed — triggering automatic rollback to previous version"
            // Roll back to the last known-good revision
            bat "kubectl rollout undo deployment/myapp"
            // Confirm rollback completed
            bat "kubectl rollout status deployment/myapp --timeout=60s"
            echo """
            ⏪ Rolled back successfully.
               To roll back to a specific revision:
                 kubectl rollout undo deployment/myapp --to-revision=<N>
               To see all revisions:
                 kubectl rollout history deployment/myapp
            """
        }

        always {
            // Clean up dangling local images to save disk space on your laptop
            bat "docker image prune -f"
        }
    }
}