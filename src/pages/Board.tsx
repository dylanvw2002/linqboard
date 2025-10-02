import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Column {
  id: string;
  name: string;
  position: number;
}

interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  position: number;
}

const Board = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    checkAccess();
    fetchBoardData();
    setupRealtimeSubscriptions();
  }, [organizationId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      toast.error("Je hebt geen toegang tot deze organisatie");
      navigate("/dashboard");
    }
  };

  const fetchBoardData = async () => {
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      setOrganization(org);

      const { data: boardData } = await supabase
        .from("boards")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      setBoard(boardData);

      if (boardData) {
        const { data: columnsData } = await supabase
          .from("columns")
          .select("*")
          .eq("board_id", boardData.id)
          .order("position");

        setColumns(columnsData || []);

        if (columnsData && columnsData.length > 0) {
          const columnIds = columnsData.map(c => c.id);
          const { data: tasksData } = await supabase
            .from("tasks")
            .select("*")
            .in("column_id", columnIds)
            .order("position");

          setTasks(tasksData || []);
        }
      }
    } catch (error: any) {
      toast.error("Fout bij laden van board");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const tasksChannel = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchBoardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Hoog";
      case "medium":
        return "Medium";
      case "low":
        return "Laag";
      default:
        return priority;
    }
  };

  const getColumnTasks = (columnName: string) =>
    tasks.filter((task) => {
      const column = columns.find((col) => col.id === task.column_id);
      return column?.name === columnName;
    });

  const handleClearCompleted = async () => {
    const completedColumn = columns.find((col) => col.name === "Afgerond");
    if (!completedColumn) return;

    const completedTasks = tasks.filter(
      (task) => task.column_id === completedColumn.id
    );

    for (const task of completedTasks) {
      await supabase.from("tasks").delete().eq("id", task.id);
    }

    toast.success(`${completedTasks.length} taken verwijderd`);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Board laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white grid grid-rows-[auto_1fr] gap-[18px] p-[22px]">
      <style>{`
        .list::-webkit-scrollbar {
          width: 14px;
        }
        .list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 4px solid transparent;
          background-clip: content-box;
        }
        @keyframes pop {
          from {
            transform: scale(0.98);
            opacity: 0.7;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Header */}
      <header className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-[#f0fdf4] border border-[#e5e7eb] px-5 py-[18px] rounded-[18px] shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
        <div>
          <div className="h-14 w-32 bg-gray-300 rounded mb-1.5"></div>
          <h1 className="font-extrabold tracking-[0.2px] leading-[1.1] text-[clamp(26px,3.5vw,48px)]">
            {organization?.name || "NRG TOTAAL"} – To-Do Board
          </h1>
          <p className="text-[#667085] font-semibold text-[clamp(12px,1.4vw,16px)]">
            Live overzicht voor het team – dubbelklik op een taak om te bewerken • Sleep om te ordenen
          </p>
        </div>
        <div className="[font-variant-numeric:tabular-nums] font-bold text-[clamp(20px,3vw,40px)] px-3.5 py-1.5 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)]">
          {formatTime(currentTime)}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleFullscreen}
            className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-3.5 py-2.5 rounded-xl font-bold cursor-pointer transition-[transform_0.06s_ease,box-shadow_0.2s_ease,background_0.2s_ease] shadow-[0_10px_30px_rgba(2,6,23,0.08)] hover:-translate-y-px hover:bg-[#f3f4f6] text-[clamp(12px,1.4vw,16px)]"
          >
            ⛶ Volledig scherm
          </button>
          <button
            onClick={handleClearCompleted}
            className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-3.5 py-2.5 rounded-xl font-bold cursor-pointer transition-[transform_0.06s_ease,box-shadow_0.2s_ease,background_0.2s_ease] shadow-[0_10px_30px_rgba(2,6,23,0.08)] hover:-translate-y-px hover:bg-[#f3f4f6] text-[clamp(12px,1.4vw,16px)]"
          >
            🧹 Leeg Afgerond
          </button>
        </div>
      </header>

      {/* Board Grid */}
      <main className="grid grid-cols-[repeat(4,minmax(260px,1fr))] gap-[18px] h-full max-[1100px]:grid-cols-2 max-[680px]:grid-cols-1">
        {/* Kolom 1: Vandaag */}
        <section className="flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-white border border-[#e5e7eb] mb-3.5">
            <div className="text-[clamp(16px,2vw,22px)] font-extrabold">Vandaag</div>
            <button className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-[#f3f4f6]">
              ＋ Taak
            </button>
          </div>
          <div className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-3 content-start list">
            {getColumnTasks("Vandaag").map((task) => (
              <article
                key={task.id}
                className="grid grid-cols-[auto_1fr_auto] items-start gap-2.5 bg-white border border-[#e5e7eb] rounded-[18px] p-3.5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] animate-[pop_0.15s_ease-out]"
                draggable="true"
              >
                <div className="cursor-grab select-none opacity-80" title="Slepen om te verplaatsen">☰</div>
                <div>
                  <h4 className="mt-[0.1rem] mb-1 font-extrabold text-[clamp(14px,1.6vw,18px)]">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="mt-[0.15rem] mb-[0.35rem] text-[#667085] text-[clamp(12px,1.2vw,14px)]">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full font-extrabold text-xs border ${
                      task.priority === "high" ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" :
                      task.priority === "medium" ? "bg-[#fef3c7] text-[#7c2d12] border-[#fde68a]" :
                      "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]"
                    }`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className="px-2 py-1 rounded-full font-extrabold text-xs border bg-[#e0f2fe] text-[#075985] border-[#bae6fd]">
                      Algemeen
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Lagere prioriteit">▽</button>
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Hogere prioriteit">△</button>
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Markeer als afgerond">✔</button>
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Verwijderen">✖</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Kolom 2: Deze week */}
        <section className="flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-white border border-[#e5e7eb] mb-3.5">
            <div className="text-[clamp(16px,2vw,22px)] font-extrabold">Deze week</div>
            <button className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-[#f3f4f6]">
              ＋ Taak
            </button>
          </div>
          <div className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-3 content-start list">
            {getColumnTasks("Deze week").map((task) => (
              <article
                key={task.id}
                className="grid grid-cols-[auto_1fr_auto] items-start gap-2.5 bg-white border border-[#e5e7eb] rounded-[18px] p-3.5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] animate-[pop_0.15s_ease-out]"
                draggable="true"
              >
                <div className="cursor-grab select-none opacity-80" title="Slepen om te verplaatsen">☰</div>
                <div>
                  <h4 className="mt-[0.1rem] mb-1 font-extrabold text-[clamp(14px,1.6vw,18px)]">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="mt-[0.15rem] mb-[0.35rem] text-[#667085] text-[clamp(12px,1.2vw,14px)]">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full font-extrabold text-xs border ${
                      task.priority === "high" ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" :
                      task.priority === "medium" ? "bg-[#fef3c7] text-[#7c2d12] border-[#fde68a]" :
                      "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]"
                    }`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className="px-2 py-1 rounded-full font-extrabold text-xs border bg-[#e0f2fe] text-[#075985] border-[#bae6fd]">
                      Algemeen
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Lagere prioriteit">▽</button>
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Hogere prioriteit">△</button>
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Markeer als afgerond">✔</button>
                  <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Verwijderen">✖</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Kolom 3: Ziek / Verlof Stack */}
        <section className="flex flex-col min-w-0">
          <div className="grid grid-rows-[1fr_1fr] gap-3 h-full">
            {/* Ziek */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-[#fee2e2] border border-[#fecaca] mb-3">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold">Ziek</div>
                <button className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-[#f3f4f6]" title="Nieuwe naam/reden">＋</button>
              </div>
              <div className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-2 content-start list min-h-0">
                {getColumnTasks("Ziek").map((task) => (
                  <article
                    key={task.id}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-2 bg-white border border-[#e5e7eb] rounded-[18px] p-2.5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] animate-[pop_0.15s_ease-out]"
                    draggable="true"
                  >
                    <div className="cursor-grab select-none opacity-80" title="Slepen om te verplaatsen">☰</div>
                    <div>
                      <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] m-0 mb-1">{task.title}</h4>
                      {task.description && <p className="m-0 text-[#667085] text-[clamp(12px,1.2vw,14px)]">{task.description}</p>}
                    </div>
                    <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Verwijderen">✖</button>
                  </article>
                ))}
              </div>
            </div>

            {/* Verlof */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-[#dcfce7] border border-[#bbf7d0] mb-3">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold">Verlof</div>
                <button className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-[#f3f4f6]" title="Nieuwe naam/reden">＋</button>
              </div>
              <div className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-2 content-start list min-h-0">
                {getColumnTasks("Verlof").map((task) => (
                  <article
                    key={task.id}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-2 bg-white border border-[#e5e7eb] rounded-[18px] p-2.5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] animate-[pop_0.15s_ease-out]"
                    draggable="true"
                  >
                    <div className="cursor-grab select-none opacity-80" title="Slepen om te verplaatsen">☰</div>
                    <div>
                      <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] m-0 mb-1">{task.title}</h4>
                      {task.description && <p className="m-0 text-[#667085] text-[clamp(12px,1.2vw,14px)]">{task.description}</p>}
                    </div>
                    <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Verwijderen">✖</button>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Kolom 4: Afgerond / Belangrijke informatie Stack */}
        <section className="flex flex-col min-w-0">
          <div className="grid grid-rows-[1fr_1fr] gap-3 h-full">
            {/* Afgerond */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-white border border-[#e5e7eb] mb-3">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold">Afgerond</div>
                <span className="text-[#667085] font-extrabold">{getColumnTasks("Afgerond").length}</span>
              </div>
              <div className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-3 content-start list min-h-0">
                {getColumnTasks("Afgerond").map((task) => (
                  <article
                    key={task.id}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-2.5 bg-white border border-[#e5e7eb] rounded-[18px] p-3.5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] animate-[pop_0.15s_ease-out]"
                    draggable="true"
                  >
                    <div className="cursor-grab select-none opacity-80" title="Slepen om te verplaatsen">☰</div>
                    <div>
                      <h4 className="mt-[0.1rem] mb-1 font-extrabold text-[clamp(14px,1.6vw,18px)]">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="mt-[0.15rem] mb-[0.35rem] text-[#667085] text-[clamp(12px,1.2vw,14px)]">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full font-extrabold text-xs border ${
                          task.priority === "high" ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" :
                          task.priority === "medium" ? "bg-[#fef3c7] text-[#7c2d12] border-[#fde68a]" :
                          "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]"
                        }`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <span className="px-2 py-1 rounded-full font-extrabold text-xs border bg-[#e0f2fe] text-[#075985] border-[#bae6fd]">
                          Algemeen
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Lagere prioriteit">▽</button>
                      <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Hogere prioriteit">△</button>
                      <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Markeer als afgerond">✔</button>
                      <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Verwijderen">✖</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Belangrijke informatie */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-white border border-[#e5e7eb] mb-3">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold">Belangrijke informatie</div>
                <button className="bg-gradient-to-b from-white to-[#f8fafc] text-[#0b0f12] border border-[#e5e7eb] px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-[#f3f4f6]" title="Nieuwe info">＋</button>
              </div>
              <div className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-2 content-start list min-h-0">
                {getColumnTasks("Belangrijke informatie").map((task) => (
                  <article
                    key={task.id}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-2 bg-white border border-[#e5e7eb] rounded-[18px] p-2.5 shadow-[0_10px_30px_rgba(2,6,23,0.08)] animate-[pop_0.15s_ease-out]"
                    draggable="true"
                  >
                    <div className="cursor-grab select-none opacity-80" title="Slepen om te verplaatsen">☰</div>
                    <div>
                      <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] m-0 mb-1">{task.title}</h4>
                      {task.description && <p className="m-0 text-[#667085] text-[clamp(12px,1.2vw,14px)]">{task.description}</p>}
                    </div>
                    <button className="bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e7eb] px-2 py-1.5 rounded-lg text-sm hover:-translate-y-px hover:bg-[#f3f4f6]" title="Verwijderen">✖</button>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Board;
