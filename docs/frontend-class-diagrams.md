# Frontend Class Diagrams

These diagrams describe the current frontend TypeScript structure only. They avoid backend classes and keep
relationships focused on ownership, inheritance, routing, service flow, and game/quiz orchestration.

## Global Package Diagram

This diagram gives a package-level view of the SPA. `App` creates the service container and the router,
the router mounts `BaseComponent` views, services use `ApiClient`, and the game engine stays isolated behind
its container, blocks, registries, and `BaseGame` contract.

```plantuml
@startuml
hide members
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
left to right direction

package "Core and Routing" as Core {
  class App
  class Router
}

package "Services" as Services {
  class createAppServices <<factory>>
  class ApiClient
  class AuthService
  class ChapterService
  class QuizService

  package "teacher" as SvcTeacher {
  }
  package "admin" as SvcAdmin {
  }
}

package "Components and Views" as UI {
  abstract class BaseComponent

  package "Layout" as UI_Layout {
    class HeaderComponent
    class FooterComponent <<module>>
  }

  package "Public" as UI_Public {
    class HomeComponent
    class LoginComponent
  }

  package "Shared" as UI_Shared {
    class NotFoundComponent
  }

  package "GameHome" as UI_GameHome {
    class GameHomeComponent
  }

  package "MatheoPanel" as UI_Panel {
    class MatheoPanelComponent
    class NavigationComponent
  }
}

package "Features" as Features {
  class QuizPlayComponent

  package "GameEngine" as GE {
    package "core" as GE_Core {
      class GameContainerComponent
      class SequenceManager
    }

    package "blocks" as GE_Blocks {
      class DialogueBlockComponent
      class InfoBlockComponent
      class RiddleBlockComponent
    }

    package "games" as GE_Games {
      abstract class BaseGame
      class QuestionSequence
      class GamesRegistry <<module>>
    }

    package "configs" as GE_Configs {
      class ConfigsRegistry <<module>>
    }
  }
}

package "Models and Types" as Models {
  package "domain" as M_Domain {
    interface User
    interface Chapter
    class GameStep <<union>>
  }

  package "services" as M_Services {
    interface AppServices
  }

  package "game-engine" as M_GE {
    interface BaseGameContext
    class BaseGameParams <<type>>
  }

  package "core" as M_Core {
    interface RouteDefinition
    interface RouteMatch
  }
}

' --- Inter-package dependencies ---

Core --> Services : bootstraps
Core --> UI : owns shell,\ndelegates mount
Core --> Features : route targets

Router ..> M_Core : route contracts
Router ..> M_Services : guards via AppServices

Services --> Models : DTOs and contracts
createAppServices ..> M_Services : implements
ApiClient ..> GE_Configs : local scenario fallback

UI --> Services
UI --> Models

Features --> UI : extends BaseComponent
Features --> Services
Features --> Models

GE_Core --> GE_Blocks : step orchestration
GE_Blocks --> GE_Games : riddle shell
GE_Configs --> M_Domain : GameStep, Chapter

' --- Fix for Notes (Floating notes linked to packages) ---

note as NoteTeacher
  TeacherClassService
  TeacherQuizService
  TeacherContentClassAccessService
  StudentContentAccessService
end note
SvcTeacher .. NoteTeacher

note as NoteAdmin
  AdminManagementService
  AdminQuizService
end note
SvcAdmin .. NoteAdmin

note as NoteGE
  Concrete games (BaseConversion, HexConversion,
  PianoFractions, FractalLuthier) are registered
  in GamesRegistry — not shown individually.
end note
GE .. NoteGE

note as NotePanel
  Profile, Progress, ClassManagement,
  QuizManagement, AdminPanel, etc.
end note
UI_Panel .. NotePanel

@enduml
```

## Main Application Diagram

This diagram focuses on the entrypoint and routing contract. The current shell owns a hidden
`HeaderComponent`; the old `FooterComponent` class no longer exists and is represented by the `FooterModule`
template/style helpers used by public pages such as `AboutComponent`.

```plantuml
@startuml
skinparam classAttributeIconSize 0
left to right direction

package "src" {
  class App {
    - services: AppServices
    - router: Router | null
    - header: HeaderComponent | null
    + App()
    + init(): void
    - setupRoutes(router: Router): void
    - bindEvents(): void
    - injectResponsiveShellStyles(): void
    - mainContainer(): HTMLElement
  }
}

package "router" {
  class Router {
    - routes: RouteDefinition[]
    - container: HTMLElement
    - currentComponent: BaseComponent | null
    - notFoundFactory: RouteFactory | null
    - services: AppServices
    + Router(containerId: string, services: AppServices)
    + addRoute(pattern: string, factory: RouteFactory, options?: RouteOptions): void
    + setNotFound(factory: RouteFactory): void
    + navigate(path: string): void
    + clearTokenFromUrl(): void
    + start(): void
    + handleRouting(): Promise<void>
    - bootstrapPathFromLocation(): void
    - canEnter(definition: RouteDefinition): Promise<boolean>
    - mount(component: BaseComponent): void
    - mountNotFound(path: string): Promise<void>
    - findMatch(path: string): RouteMatch | null
    - matchPattern(pattern: string, path: string): RouteParams | null
    - parts(path: string): string[]
    - normalize(path: string): string
  }

  interface RouteParams {
    + [key: string]: string
  }

  class RouteFactory <<type>> {
    + (params: RouteParams): BaseComponent | Promise<BaseComponent>
  }

  interface RouteDefinition {
    + pattern: string
    + factory: RouteFactory
    + protectedRoute: boolean
    + allowGuest: boolean
    + roles: UserRole[] | null
  }

  interface RouteMatch {
    + definition: RouteDefinition
    + params: RouteParams
  }
}

package "components" {
  abstract class BaseComponent {}

  class HeaderComponent {
    - services: AppServices
    + HeaderComponent(container: HTMLElement, services: AppServices)
    + init(): void
    + refresh(): void
    # bindEvents(): void
  }

  class FooterModule <<module>> {
    + footerTemplate(): string
    + footerStyles(hostSelector?: string): string
  }
}

package "services" {
  interface AppServices
  class AppServicesFactory <<factory>> {
    + createAppServices(): AppServices
  }
}

package "route components" {
  class HomeComponent
  class AboutComponent
  class LoginComponent
  class RegisterComponent
  class ResetPasswordComponent
  class VerifyEmailComponent
  class StudentIntroComponent
  class GameHomeComponent
  class MatheoPanelComponent
  class QuizPlayComponent
  class GameContainerComponent
  class NotFoundComponent
}

BaseComponent <|-- HeaderComponent
App *-- AppServices : creates
App *-- Router : owns
App *-- HeaderComponent : owns
App ..> AppServicesFactory : calls
Router ..> BaseComponent : mounts/destroys
Router ..> RouteDefinition
RouteDefinition --> RouteFactory
RouteMatch *-- RouteParams

App ..> HomeComponent
App ..> AboutComponent
App ..> LoginComponent
App ..> RegisterComponent
App ..> ResetPasswordComponent
App ..> VerifyEmailComponent
App ..> StudentIntroComponent
App ..> GameHomeComponent
App ..> MatheoPanelComponent
App ..> QuizPlayComponent
App ..> GameContainerComponent
App ..> NotFoundComponent
AboutComponent ..> FooterModule
@enduml
```

## Components Diagram

This diagram shows the frontend visual classes outside the game engine. All rendered views inherit from
`BaseComponent`; large views such as `GameHomeComponent`, `MatheoPanelComponent`, `ClassManagementComponent`,
`QuizManagementComponent`, and `AdminPanelComponent` act as local orchestrators that mount child components
and react to typed custom events.

```plantuml
@startuml
left to right direction
skinparam classAttributeIconSize 0
hide empty members

package "components" {

  abstract class BaseComponent {
    # container: HTMLElement
    # componentId: string
    # root: HTMLElement | null
    - styleElement: HTMLStyleElement | null
    - disposers: Function[]
    + {abstract} init(): void
    + destroy(): void
    # render(htmlTemplate: string, componentStyle?: string): void
    # updateRegion(selector: string, htmlTemplate: string): void
    # {abstract} bindEvents(): void
    # query(selector: string): HTMLElement | null
    # queryAll(selector: string): HTMLElement[]
    # listen(target: EventTarget, type: string, listener: Function): void
    # listenTo(target: EventTarget, type: string, listener: Function): void
    # emit(name: string, detail?: any): void
    # clearListeners(): void
  }

  package "Layout" {
    class HeaderComponent
    class FooterModule <<module>>
  }

  package "Shared" {
    class ConfirmationModalComponent
    class BackToMapButtonModule <<module>>
    class FloatingTopButtonModule <<module>>
    class NotFoundComponent
  }

  package "Public" {
    class HomeComponent
    class AboutComponent
    class StudentIntroComponent

    package "Auth" {
      class LoginComponent
      class RegisterComponent
      class ResetPasswordComponent
      class VerifyEmailComponent
    }
  }

  package "GameHome and QuizPlayer" {
    class GameHomeComponent
    class QuizPlayComponent
  }

  package "MatheoPanel" {
    class MatheoPanelComponent
    class NavigationComponent
    class ProfileComponent
    class ProgressComponent
    class StudentClassComponent
    class ClassManagementComponent
    class ClassManagementHeaderComponent
    class ClassListComponent
    class ClassDetailComponent
    class ClassFormModalComponent
    class StudentsImportModalComponent
    class ProgressExportModalComponent
    class QuizManagementComponent
    class StudentContentManagementComponent
    class AdminPanelComponent
    class QuizQuestionsSectionController
  }
}

' --- Relations de dépendances et de composition ---

AboutComponent ..> FooterModule
AboutComponent ..> BackToMapButtonModule
GameHomeComponent *-- ConfirmationModalComponent
GameHomeComponent ..> FloatingTopButtonModule
QuizPlayComponent ..> FloatingTopButtonModule

MatheoPanelComponent *-- NavigationComponent
MatheoPanelComponent ..> ProfileComponent : mounts
MatheoPanelComponent ..> ProgressComponent : mounts
MatheoPanelComponent ..> StudentClassComponent : mounts
MatheoPanelComponent ..> ClassManagementComponent : mounts
MatheoPanelComponent ..> QuizManagementComponent : mounts
MatheoPanelComponent ..> StudentContentManagementComponent : mounts
MatheoPanelComponent ..> AdminPanelComponent : mounts

ClassManagementComponent *-- ClassManagementHeaderComponent
ClassManagementComponent *-- ClassListComponent
ClassManagementComponent *-- ClassDetailComponent
ClassManagementComponent *-- ClassFormModalComponent
ClassManagementComponent *-- StudentsImportModalComponent
ClassManagementComponent *-- ProgressExportModalComponent
ClassManagementComponent *-- ConfirmationModalComponent
ClassManagementComponent *-- ProgressComponent

QuizManagementComponent *-- QuizQuestionsSectionController
QuizManagementComponent *-- ConfirmationModalComponent

AdminPanelComponent *-- QuizQuestionsSectionController
AdminPanelComponent *-- ConfirmationModalComponent

note top of BaseComponent
  Conformément à nos contraintes (zéro framework UI),
  tous les composants visuels de ces paquetages héritent 
  strictement de BaseComponent pour la manipulation du DOM.
end note

@enduml
```

## Services Diagram

This diagram shows the frontend service flow toward the backend API. `ApiClient` is the single HTTP funnel;
domain services unwrap typed envelopes, compose local state where needed, and expose methods consumed by
components or the game engine.

```plantuml
@startuml
left to right direction
skinparam classAttributeIconSize 0
hide members

package "services" {
  class ApiClient
  class AuthService
  class UserService
  class ChapterService
  class ContentService
  class ProgressMetricsService
  class QuizService

  package "teacher" {
    class TeacherClassService
    class TeacherQuizService
    class TeacherContentClassAccessService
    class StudentContentAccessService
  }

  package "admin" {
    class AdminManagementService
    class AdminQuizService
  }

  interface AppServices
  class AppServicesFactory <<factory>>
}

' --- Assemblage via la Factory ---
AppServicesFactory ..> AppServices : "crée"
AppServices *-- ApiClient
AppServices *-- AuthService
AppServices *-- UserService
AppServices *-- ChapterService
AppServices *-- ContentService
AppServices *-- ProgressMetricsService
AppServices *-- QuizService
AppServices *-- TeacherClassService
AppServices *-- TeacherQuizService
AppServices *-- TeacherContentClassAccessService
AppServices *-- StudentContentAccessService
AppServices *-- AdminManagementService
AppServices *-- AdminQuizService

' --- Dépendances internes métier ---
AuthService ..> ApiClient
UserService ..> ApiClient
UserService ..> AuthService
ChapterService ..> ApiClient
ChapterService ..> AuthService
ContentService ..> ApiClient
QuizService ..> ApiClient

TeacherClassService ..> ApiClient
TeacherQuizService ..> ApiClient
TeacherContentClassAccessService ..> ApiClient

StudentContentAccessService ..> TeacherClassService
StudentContentAccessService ..> TeacherQuizService
StudentContentAccessService ..> ChapterService
StudentContentAccessService ..> TeacherContentClassAccessService

AdminQuizService ..> ApiClient
@enduml
```

## Game Engine Diagram

This diagram represents the current level engine. `GameContainerComponent` loads the API-hydrated scenario,
drives `SequenceManager`, mounts blocks, and uses `ChapterService` for persistence. `RiddleBlockComponent`
owns one `BaseGame` instance and handles the shared riddle shell; concrete mini-games only implement game rules.

```plantuml
@startuml
left to right direction
skinparam classAttributeIconSize 0
hide members

package "External Contracts" {
  abstract class BaseComponent
  class Router
  class AppServices
}

package "Game Engine" {
  package "Core Orchestration" {
    class GameContainerComponent
    class SequenceManager
  }

  package "Blocks (UI Views)" {
    class DialogueBlockComponent
    class InfoBlockComponent
    class RiddleBlockComponent
    class StepInteractionChrome <<module>>
  }

  package "Mini-Games (Open/Closed)" {
    class GamesRegistry <<module>>
    abstract class BaseGame
    class PianoFractionsGame
    class BaseConversionGame
    class HexConversionGame
    class FractalLuthierGame
    class QuestionSequence
  }

  package "Configs" {
    class ConfigsRegistry <<module>>
  }
}

package "Models (Typing)" {
  class GameStep <<union>>
  interface DialogueStep
  interface RiddleStep
  interface InfoStep
  interface BaseGameContext
  class BaseGameParams <<type>>
}

' --- Héritage structurel ---
BaseComponent <|-- GameContainerComponent
BaseComponent <|-- DialogueBlockComponent
BaseComponent <|-- InfoBlockComponent
BaseComponent <|-- RiddleBlockComponent

BaseGame <|-- PianoFractionsGame
BaseGame <|-- BaseConversionGame
BaseGame <|-- HexConversionGame
BaseGame <|-- FractalLuthierGame

' --- Orchestration et cycle de vie ---
GameContainerComponent *-- SequenceManager : "pilote"
GameContainerComponent ..> DialogueBlockComponent : "monte"
GameContainerComponent ..> InfoBlockComponent : "monte"
GameContainerComponent ..> RiddleBlockComponent : "monte"
GameContainerComponent --> AppServices : "consomme (API, Auth)"
GameContainerComponent --> Router : "utilise"

SequenceManager o-- GameStep : "itère sur"

' --- Contrat des Mini-Jeux ---
RiddleBlockComponent *-- BaseGame : "encapsule"
RiddleBlockComponent ..> GamesRegistry : "résout via"
RiddleBlockComponent ..> StepInteractionChrome : "habillage UI"

GamesRegistry ..> PianoFractionsGame : "référence"
GamesRegistry ..> BaseConversionGame : "référence"
GamesRegistry ..> HexConversionGame : "référence"
GamesRegistry ..> FractalLuthierGame : "référence"

BaseConversionGame *-- QuestionSequence
HexConversionGame *-- QuestionSequence

' --- Définition des Modèles ---
GameStep ..> DialogueStep
GameStep ..> RiddleStep
GameStep ..> InfoStep

RiddleBlockComponent ..> BaseGameContext
RiddleBlockComponent ..> BaseGameParams

@enduml
```

## Quiz Diagram

This diagram isolates questionnaires. `GameHomeComponent` opens quiz routes, `QuizPlayComponent` handles
attempts and corrections, teachers/admins edit quiz content through shared question-section logic, and
class access for public/private quizzes is handled through the student-content facade.

```plantuml
@startuml
left to right direction
skinparam classAttributeIconSize 0
hide empty members

package "quiz-facing components" {
  abstract class BaseComponent
  class GameHomeComponent
  class QuizPlayComponent
  class QuizManagementComponent
  class AdminPanelComponent
  class StudentContentManagementComponent
  class QuizQuestionsSectionController
  class ConfirmationModalComponent
}

package "quiz services" {
  class ApiClient
  class QuizService
  class TeacherQuizService
  class AdminQuizService
  class StudentContentAccessService
  class TeacherContentClassAccessService
}

package "quiz models" {
  interface QuizSummary
  interface QuizPlayView
  interface QuizDetail
  interface QuizQuestionPublic
  interface QuizQuestionFull
  interface QuizOptionPublic
  interface QuizOptionFull
  interface QuizProgress
  interface QuizCorrection
  interface QuizCorrectionQuestion
}

' --- Héritage UI ---
BaseComponent <|-- GameHomeComponent
BaseComponent <|-- QuizPlayComponent
BaseComponent <|-- QuizManagementComponent
BaseComponent <|-- AdminPanelComponent
BaseComponent <|-- StudentContentManagementComponent
BaseComponent <|-- ConfirmationModalComponent

' --- Dépendances UI -> Services ---
GameHomeComponent ..> QuizService : list/progress/start
QuizPlayComponent ..> QuizService : play/correction
QuizManagementComponent ..> TeacherQuizService : authoring
AdminPanelComponent ..> AdminQuizService : review
StudentContentManagementComponent ..> StudentContentAccessService : class access
StudentContentAccessService ..> TeacherContentClassAccessService

' --- Composition UI ---
QuizManagementComponent *-- QuizQuestionsSectionController
AdminPanelComponent *-- QuizQuestionsSectionController
QuizManagementComponent *-- ConfirmationModalComponent
AdminPanelComponent *-- ConfirmationModalComponent
GameHomeComponent *-- ConfirmationModalComponent

' --- Dépendances Services -> API ---
QuizService ..> ApiClient
TeacherQuizService ..> ApiClient
AdminQuizService ..> ApiClient
TeacherContentClassAccessService ..> ApiClient

' --- Relations Modèles (DTOs) ---
QuizSummary *-- QuizProgress
QuizPlayView *-- QuizQuestionPublic
QuizDetail --|> QuizPlayView
QuizDetail *-- QuizQuestionFull
QuizQuestionPublic *-- QuizOptionPublic
QuizQuestionFull --|> QuizQuestionPublic
QuizOptionFull --|> QuizOptionPublic
QuizCorrection *-- QuizCorrectionQuestion
QuizCorrectionQuestion --|> QuizQuestionFull
@enduml
```
